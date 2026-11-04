#!/bin/bash
# Builds the walk from the stabilized masters (review/yoko-ono/tools/masters.sh first).
# Shot 1  walk1 0.0 to 7.9 s   the street, the red gate, through the glass doors, the tables under the umbrellas (one take)
# Shot 2  walk2 2.5 to 3.85 s  the sweep across the paper-umbrella ceiling into the red room (0.5 s dissolve in)
# Shot 3  room 0.0 to 1.5 s    the second dining room, slow pan, the resting frame (0.5 s dissolve in)
# One encode per output, keyframe every 8 frames for clean scrubbing, no metadata, no audio.
set -e
R=/home/user/Motion-graphic-websites/review/yoko-ono
SITE=/home/user/Motion-graphic-websites/yoko-ono-site/assets/media
mkdir -p $R/enc
CHAIN="[0:v]trim=0:7.9,setpts=PTS-STARTPTS[a];[1:v]trim=2.5:3.85,setpts=PTS-STARTPTS[b];[2:v]trim=0:1.5,setpts=PTS-STARTPTS[c];[a][b]xfade=transition=fade:duration=0.5:offset=7.4[ab];[ab][c]xfade=transition=fade:duration=0.5:offset=8.25[abc]"
SCRUB="-c:v libx264 -preset slow -g 8 -keyint_min 8 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart -an -map_metadata -1"
echo "== film master $(date +%T)"
ffmpeg -v error -y -i $R/masters/walk1.mp4 -i $R/masters/walk2.mp4 -i $R/masters/room.mp4 -filter_complex "$CHAIN;[abc]format=yuv420p[v]" -map "[v]" -c:v libx264 -crf 12 -preset medium -g 8 -keyint_min 8 -sc_threshold 0 -pix_fmt yuv420p -an -map_metadata -1 $R/enc/film-master.mp4
echo "== 720 $(date +%T)"
ffmpeg -v error -y -i $R/enc/film-master.mp4 -vf "scale=720:1280:flags=lanczos" -crf 21 $SCRUB $SITE/walk-720.mp4
echo "== 540 $(date +%T)"
ffmpeg -v error -y -i $R/enc/film-master.mp4 -vf "scale=540:960:flags=lanczos" -crf 23 $SCRUB $SITE/walk-540.mp4
echo "== webm test copy $(date +%T)"
ffmpeg -v error -y -i $SITE/walk-720.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -g 8 -keyint_min 8 -row-mt 1 -cpu-used 2 -an $R/enc/walk-720.webm
echo "== posters $(date +%T)"
ffmpeg -v error -y -i $R/enc/film-master.mp4 -frames:v 1 -vf "scale=1080:1920" -q:v 2 $SITE/walk-poster-1080.jpg
ffmpeg -v error -y -i $R/enc/film-master.mp4 -frames:v 1 -vf "scale=720:1280" -q:v 3 $SITE/walk-poster-720.jpg
ffmpeg -v error -y -sseof -0.05 -i $R/enc/film-master.mp4 -update 1 -frames:v 1 -vf "scale=1080:1920" -q:v 2 $SITE/walk-end-1080.jpg
ffmpeg -v error -y -sseof -0.05 -i $R/enc/film-master.mp4 -update 1 -frames:v 1 -vf "scale=720:1280" -q:v 3 $SITE/walk-end-720.jpg
echo "== motion curve of the film (per 0.5s)"
ffmpeg -v info -i $SITE/walk-720.mp4 -vf "scale=180:-2,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG" -f null - 2>&1 | grep -o "YAVG=[0-9.]*" | cut -d= -f2 | awk '{s+=$1; n++; if(n%15==0){printf "%4.1f:%5.1f  ", (NR/30), s/15; s=0}}'; echo
ls -la $SITE/walk-720.mp4 $SITE/walk-540.mp4 $SITE/walk-*.jpg $R/enc/
ffprobe -v error -show_entries format=duration:stream=nb_frames -of default=noprint_wrappers=1 $SITE/walk-720.mp4
echo FILMDONE $(date +%T)
