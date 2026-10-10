#!/usr/bin/env bash
# Run the whole self-test battery against the local preview server and summarize.
set -uo pipefail
cd /home/user/Motion-graphic-websites
H=review/harness.mjs
run() { echo "=== $1 ==="; shift; timeout 400 node $H "$@" 2>&1 | sed 's/"log: Failed to load resource[^"]*"//g' | grep -v '^$'; }
run "dom (band k values and video time per scroll position)" dom
run "flick 120" flick 120 | grep -E "^(step|band)"
run "flick 240" flick 240 | grep -E "^(step|band)"
run "flick 360" flick 360 | grep -E "^(step|band)"
run "audit (worst-frame legibility)" audit
run "rm (reduced motion both ways)" rm
run "novideo (video blocked)" novideo
run "touch (gates)" touch
run "hold (press and hold)" hold
run "form, quiz, turn, anchors" form
run "shots (5 sizes)" shots
echo "=== copy gate ==="
echo "em dashes: $(grep -c '—' yuval-itay-set/index.html yuval-itay-set/assets/site.js yuval-itay-set/assets/site.css | tr '\n' ' ')"
grep -n -i -E 'leverage|seamless|empower|unlock|robust|actionable|data-driven|solutions|testament|landscape|delve|elevate' yuval-itay-set/index.html || echo "stock words and tells: none"
echo "=== weights ==="
du -b yuval-itay-set/index.html yuval-itay-set/assets/* | sort -n | awk '{printf "%8.0f KB  %s\n", $1/1024, $2}'
