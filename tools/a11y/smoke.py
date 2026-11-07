#!/usr/bin/env python3
"""Accessibility smoke run over the assembled site (landing page, all Storybooks, every demo route).

Two passes over every page, in the dark and the light theme:

1. Health pass (Playwright, this file): the page loads, throws no error, logs no console error and requests no
   missing same-origin file. A screenshot is written for every page that fails.
2. Accessibility pass: `node tools/a11y/rgaa-audit.mjs` (a11ylint for the RGAA numbering + axe-core 4.14.0). This
   script does not reimplement it; it feeds it the URL list, reads rgaa-report.json and applies the exit policy.

Usage:
    python3 tools/a11y/smoke.py --site site --out a11y-report [--theme dark,light] [--limit N] [--no-health]

Exit codes: 0 pass, 1 health failure or blocking accessibility finding, 2 setup error (missing site, runner crash).
Waivers live in tools/a11y/known-issues.json; every entry needs {engine, rule, urlPattern, reason, finding}.
"""
from __future__ import annotations

import argparse
import asyncio
import functools
import http.server
import json
import re
import socketserver
import subprocess
import sys
import threading
from pathlib import Path

HERE = Path(__file__).resolve().parent
IGNORED_CONSOLE = re.compile(r"ERR_TUNNEL_CONNECTION_FAILED|fonts\.googleapis\.com|fonts\.gstatic\.com|ERR_BLOCKED_BY_CLIENT")
IGNORED_URL = re.compile(r"fonts\.googleapis\.com|fonts\.gstatic\.com")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):  # noqa: D401 - silence the access log
        pass


class QuietServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

    def handle_error(self, request, client_address):  # browsers abort requests (BrokenPipe): not an error here
        pass


def serve(site: Path) -> tuple[socketserver.TCPServer, str]:
    handler = functools.partial(QuietHandler, directory=str(site))
    server = QuietServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{server.server_address[1]}"


def build_urls(site: Path, base: str, limit: int) -> list[dict]:
    urls: list[dict] = [{"url": f"{base}/index.html", "label": "landing", "group": "landing", "kind": "page"}]
    for name in ("react", "angular", "svelte"):
        index = site / name / "index.json"
        if not index.exists():
            continue
        entries = json.loads(index.read_text())["entries"].values()
        for e in entries:
            if e["type"] == "story":
                urls.append({
                    "url": f"{base}/{name}/iframe.html?id={e['id']}&viewMode=story",
                    "label": f"{name}:{e['id']}", "group": f"{name} storybook", "kind": "story",
                })
    routes = json.loads((HERE / "demo-routes.json").read_text())["routes"]
    for r in routes:
        urls.append({"url": f"{base}/{r['url']}", "label": r["label"], "group": "demo", "kind": "page"})
    return urls[:limit] if limit else urls


def themed(url: str, theme: str, kind: str) -> str:
    if kind != "story":
        return url
    return f"{url}&globals=theme:{theme}"


async def health_pass(urls: list[dict], themes: list[str], out: Path, concurrency: int) -> list[dict]:
    from playwright.async_api import async_playwright

    failures: list[dict] = []
    shots = out / "screenshots"
    shots.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(concurrency)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        contexts = {}
        for theme in themes:
            ctx = await browser.new_context(
                viewport={"width": 1280, "height": 800}, color_scheme=theme, reduced_motion="reduce"
            )
            await ctx.add_init_script(f"try{{localStorage.setItem('microcks-theme','{theme}')}}catch(e){{}}")
            await ctx.route(IGNORED_URL, lambda route: route.abort())
            contexts[theme] = ctx

        async def visit(item: dict, theme: str):
            async with sem:
                page = await contexts[theme].new_page()
                problems: list[str] = []
                page.on("pageerror", lambda e: problems.append(f"pageerror: {e}"))

                def on_console(msg):
                    location_url = (msg.location or {}).get("url", "")
                    if msg.type == "error" and not IGNORED_CONSOLE.search(msg.text) and not IGNORED_URL.search(location_url):
                        problems.append(f"console.error: {msg.text[:300]}")

                def on_response(resp):
                    if resp.status >= 400 and not IGNORED_URL.search(resp.url):
                        problems.append(f"HTTP {resp.status}: {resp.url}")

                page.on("console", on_console)
                page.on("response", on_response)
                try:
                    await page.goto(themed(item["url"], theme, item["kind"]), wait_until="load", timeout=30000)
                    try:
                        await page.wait_for_load_state("networkidle", timeout=5000)
                    except Exception:
                        pass
                    await page.wait_for_timeout(800)
                except Exception as exc:  # navigation failure
                    problems.append(f"navigation: {exc}")
                if problems:
                    name = re.sub(r"[^a-zA-Z0-9._-]+", "_", f"{item['label']}-{theme}")[:120]
                    shot = shots / f"health-{name}.png"
                    try:
                        await page.screenshot(path=str(shot))
                    except Exception:
                        pass
                    failures.append({"label": item["label"], "theme": theme, "url": item["url"],
                                     "problems": sorted(set(problems)), "screenshot": shot.name})
                await page.close()

        await asyncio.gather(*(visit(i, t) for i in urls for t in themes))
        await browser.close()
    return failures


def run_runner(urls: list[dict], themes: list[str], out: Path, concurrency: int) -> int:
    urls_file = out / "urls.json"
    urls_file.write_text(json.dumps({"routes": [{"url": u["url"], "label": u["label"], "kind": u["kind"]} for u in urls]}))
    cmd = [
        "node", str(HERE / "rgaa-audit.mjs"), "--urls-from", str(urls_file), "--out", str(out),
        "--theme", ",".join(themes), "--concurrency", str(concurrency),
        "--known-issues", str(HERE / "known-issues.json"), "--format", "json,md",
    ]
    print("smoke: " + " ".join(cmd), flush=True)
    return subprocess.run(cmd).returncode


def summarize(urls: list[dict], report: dict, health: list[dict], themes: list[str]) -> str:
    group_of = {u["label"]: u["group"] for u in urls}
    groups: dict[str, dict] = {}
    for page in report["pages"]:
        g = groups.setdefault(group_of.get(page["label"], "other"), {
            "pages": 0, "load_errors": 0, "axe": {"critical": 0, "serious": 0, "moderate": 0, "minor": 0},
            "a11ylint": 0, "waived": 0, "criteria_ko": set(), "criteria_ok": set(),
        })
        g["pages"] += 1
        g["load_errors"] += 1 if page["loadError"] else 0
        for c in page["criteria"]:
            if c["status"] == "non-compliant":
                g["criteria_ko"].add(c["id"])
            elif c["status"] == "compliant":
                g["criteria_ok"].add(c["id"])
            for f in c["findings"]:
                if f.get("waived"):
                    g["waived"] += 1
                elif f["engine"] == "axe":
                    g["axe"][f["impact"]] += 1
                else:
                    g["a11ylint"] += f.get("count", 1)
        for u in page.get("axeUnmapped", []):
            g["axe"][u["impact"]] += 1
    lines = [
        "# Accessibility smoke run", "",
        "> Automated checks only. They find some failures; they cannot prove conformance. The status of the demo stays "
        "\"non audité\" until a human audit (see docs/accessibility.md).", "",
        f"Themes: {', '.join(themes)} · RGAA {report['rgaaVersion']} · {report['tool']['a11ylint']} · {report['tool']['axe']}", "",
        "| Group | Pages x themes | Load errors | axe critical/serious/moderate/minor | a11ylint findings | Waived | RGAA criteria ok / ko |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for name, g in sorted(groups.items()):
        a = g["axe"]
        lines.append(
            f"| {name} | {g['pages']} | {g['load_errors']} | {a['critical']}/{a['serious']}/{a['moderate']}/{a['minor']} "
            f"| {g['a11ylint']} | {g['waived']} | {len(g['criteria_ok'])} / {len(g['criteria_ko'])} ({', '.join(sorted(g['criteria_ko'], key=lambda x: [int(p) for p in x.split('.')])) or 'none'}) |"
        )
    lines += ["", f"Criteria with an automated test: {sum(1 for c in report['summary']['criteria'] if c['automatedBy'] != 'manual')} of "
              f"{len(report['summary']['criteria'])}. Totals: " + ", ".join(f"{k} {v}" for k, v in report["summary"]["totals"].items()), ""]
    lines += [f"## Health failures ({len(health)})", ""]
    for h in health[:60]:
        lines.append(f"- {h['label']} ({h['theme']}): " + "; ".join(h["problems"][:3]))
    if not health:
        lines.append("None.")
    return "\n".join(lines) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site", default="site")
    ap.add_argument("--out", default="a11y-report")
    ap.add_argument("--theme", default="dark,light")
    ap.add_argument("--limit", type=int, default=0, help="audit only the first N URLs (debug)")
    ap.add_argument("--concurrency", type=int, default=4)
    ap.add_argument("--no-health", action="store_true", help="skip the Playwright health pass")
    args = ap.parse_args()

    site, out = Path(args.site).resolve(), Path(args.out).resolve()
    if not (site / "index.html").exists():
        print(f"smoke: {site}/index.html not found. Run `pnpm build:site` first.", file=sys.stderr)
        return 2
    if not (HERE / "dist" / "a11ylint.iife.js").exists():
        print("smoke: dist/a11ylint.iife.js not found. Run `pnpm --filter a11y-tools build`.", file=sys.stderr)
        return 2
    out.mkdir(parents=True, exist_ok=True)
    themes = [t for t in args.theme.split(",") if t]

    server, base = serve(site)
    try:
        urls = build_urls(site, base, args.limit)
        print(f"smoke: {len(urls)} URLs x {len(themes)} theme(s) at {base}", flush=True)
        health = [] if args.no_health else asyncio.run(health_pass(urls, themes, out, args.concurrency + 2))
        code = run_runner(urls, themes, out, args.concurrency)
    finally:
        server.shutdown()

    report_path = out / "rgaa-report.json"
    if code == 2 and not report_path.exists():
        print("smoke: the runner could not run", file=sys.stderr)
        return 2
    report = json.loads(report_path.read_text())
    summary = summarize(urls, report, health, themes)
    (out / "summary.md").write_text(summary)
    (out / "audit.md").write_text(summary + "\n" + (out / "rgaa-report.md").read_text())
    (out / "results.json").write_text(json.dumps({"health": health, "runnerExitCode": code, "summary": report["summary"]["totals"],
                                                   "blockingFindings": report["summary"]["blockingFindings"]}, indent=2))
    print(summary)

    failed = bool(health) or code != 0
    print("smoke: FAIL" if failed else "smoke: PASS (automated checks only; not a conformance claim)")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
