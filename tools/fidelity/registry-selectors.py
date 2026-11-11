"""Count page CSS selectors that reach into registry classes.
usage: python3 -I registry-selectors.py <repo> [--check <allowlist>]
Allowlist: one 'page-folder<TAB>selector' per line; blank lines and lines starting with '#' are ignored.
--check exits 1 on any selector not listed. `--self-test` checks the allowlist parser and exits."""
import re, sys, glob, os, collections
def load_allow(lines):
    return set(l.rstrip('\n') for l in lines if l.strip() and not l.startswith('#'))
if sys.argv[1:] == ['--self-test']:
    assert load_allow(['# c\tx\n', '\n', 'a\t.b .icon\n']) == {'a\t.b .icon'}
    print('ok'); sys.exit(0)
root = sys.argv[1]
strip = lambda t: re.sub(r'/\*.*?\*/', '', t, flags=re.S)
reg = set()
for f in glob.glob(root + '/packages/registry/src/css/*.css'):
    reg |= set(re.findall(r'\.([a-z][a-z0-9-]*)', strip(open(f).read())))
reg -= {'sr-only'}
pages = root + '/packages/demo-styles/src/pages'
found, per, cls = [], collections.Counter(), collections.Counter()
for f in sorted(glob.glob(pages + '/**/*.css', recursive=True)):
    folder = os.path.relpath(f, pages).split('/')[0]
    for sel in re.findall(r'([^{}]+)\{', strip(open(f).read())):
        if sel.strip().startswith('@'): continue
        for s in sel.split(','):
            s = ' '.join(s.split())
            hits = [c for c in re.findall(r'\.([a-z][a-z0-9-]*)', s) if c in reg]
            if hits:
                found.append(f'{folder}\t{s}'); per[folder] += 1
                for c in set(hits): cls[c] += 1
if '--check' in sys.argv:
    allow = load_allow(open(sys.argv[sys.argv.index('--check') + 1]))
    new = [x for x in found if x not in allow]
    for x in new: print('NEW', x)
    sys.exit(1 if new else 0)
print('selectors', len(found), 'classes', len(cls))
print(per.most_common()); print(cls.most_common(25))
