#!/usr/bin/env bash
# Build the scrub video, poster and ending frame from the bridged frame sequence.
# Usage: review/encode-hero.sh <frames-dir> <crf>
set -euo pipefail
FRAMES=${1:-/home/user/Motion-graphic-websites/review/frames}
CRF=${2:-22}
SITE=/home/user/Motion-graphic-websites/yuval-itay-set
n=$(ls "$FRAMES"/f_*.jpg | wc -l)
echo "frames: $n"
ffmpeg -v error -y -framerate 24 -i "$FRAMES/f_%04d.jpg" -c:v libx264 -crf "$CRF" -preset slow -g 8 -keyint_min 8 -pix_fmt yuv420p -movflags +faststart -an "$SITE/assets/hero-scrub.mp4"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,nb_frames,duration -of default=nw=1 "$SITE/assets/hero-scrub.mp4"
echo "bytes: $(stat -c %s "$SITE/assets/hero-scrub.mp4")"
ffmpeg -v error -y -i "$SITE/assets/hero-scrub.mp4" -frames:v 1 -q:v 2 "$SITE/assets/hero-poster.jpg"
ffmpeg -v error -y -sseof -0.1 -i "$SITE/assets/hero-scrub.mp4" -update 1 -frames:v 1 -q:v 2 /home/user/Motion-graphic-websites/review/hero-last-frame.jpg
echo "poster bytes: $(stat -c %s "$SITE/assets/hero-poster.jpg")"
# ending-rest check: motion curve tail
ffmpeg -i "$SITE/assets/hero-scrub.mp4" -vf "tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG" -f null - 2>&1 | grep -o 'YAVG=[0-9.]*' | awk -F= '{printf "%.2f ", $2}' | awk '{n=split($0,a," "); printf "motion first5: %s %s %s %s %s | last8: ", a[1],a[2],a[3],a[4],a[5]; for(i=n-7;i<=n;i++) printf "%s ", a[i]; print ""}'
