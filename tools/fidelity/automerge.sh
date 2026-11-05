#!/bin/bash
# Merge open PRs (lowest number first) when clean and every check on the head is completed with success/skipped.
# usage: bash tools/fidelity/automerge.sh [--once] [--dry-run] [seconds=5400]
#   --once     single pass over the open PRs, then exit
#   --dry-run  print what would be merged, never merge
# PRs labelled `hold` are skipped. Merges are squash, pinned on the head sha that was checked.
R=repos/SebastienDegodez/microcks-deep-ink
once=0; dry=0; budget=5400
for a in "$@"; do
  case "$a" in
    --once) once=1 ;;
    --dry-run) dry=1 ;;
    *) budget=$a ;;
  esac
done
end=$((SECONDS+budget))
while :; do
  open=$(gh api "$R/pulls?state=open&sort=created&direction=asc&per_page=100" --jq '.[] | select([.labels[].name] | index("hold") | not) | .number') || exit 1
  [ -z "$open" ] && { echo "$(date +%T) none open (or all on hold)"; exit 0; }
  for n in $open; do
    read -r st sha < <(gh api "$R/pulls/$n" --jq '"\(.mergeable_state) \(.head.sha)"')
    checks=$(gh api "$R/commits/$sha/check-runs?per_page=100" --jq '"\([.check_runs[]|select(.status!="completed" or (.conclusion!="success" and .conclusion!="skipped"))]|length) \(.total_count)"')
    read -r bad total <<<"$checks"
    if [ "$st" = clean ] && [ "$bad" = 0 ] && [ "${total:-0}" -gt 0 ]; then
      if [ $dry = 1 ]; then
        echo "$(date +%T) would merge #$n (squash, sha=$sha)"
      else
        echo "$(date +%T) merge #$n $(gh api -X PUT "$R/pulls/$n/merge" -f merge_method=squash -f sha="$sha" --jq .merged 2>&1)"
        sleep 10; break
      fi
    else
      echo "$(date +%T) skip #$n state=$st failing/pending=$bad checks=$total"
    fi
  done
  [ $once = 1 ] && exit 0
  [ $SECONDS -ge $end ] && exit 0
  sleep 90
done
