#!/bin/bash
# Builds the hero film from the stabilized masters: walk1 0-7.6s, crossfade, walk2 2.7-3.95s (the umbrella room),
# crossfade, walk1 9.7-10.65s (the lounge at rest). One encode per output, keyframe every 8 frames for clean scrubbing.
set -e
R=/home/user/Motion-graphic-websites/review/yoko-ono
SITE=/home/user/Motion-graphic-websites/yoko-ono-site/assets/media
CHAIN="[0:v]trim=0:7.6,setpts=PTS-STARTPTS[a];[1:v]trim=2.7:3.95,setpts=PTS-STARTPTS[b];[2:v]trim=9.7:10.65,setpts=PTS-STARTPTS[c];[a][b]xfade=transition=fade:duration=0.4:offset=7.2[ab];[ab][c]xfade=transition=fade:duration=0.4:offset=8.05[abc]"
SCRUB="-c:v libx264 -preset slow -g 8 -keyint_min 8 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart -an -map_metadata -1"
echo "== film master $(date +%T)"
ffmpeg -v error -y -i $R/masters/walk1.mp4 -i $R/masters/walk2.mp4 -i $R/masters/walk1.mp4 -filter_complex "$CHAIN;[abc]format=yuv420p[v]" -map "[v]" -c:v libx264 -crf 12 -preset medium -g 8 -keyint_min 8 -sc_threshold 0 -pix_fmt yuv420p -an -map_metadata -1 $R/enc/film-master.mp4
echo "== 720 $(date +%T)"
ffmpeg -v error -y -i $R/enc/film-master.mp4 -vf "scale=720:1280:flags=lanczos" -crf 22 $SCRUB $SITE/hero-film-720.mp4
echo "== 540 $(date +%T)"
ffmpeg -v error -y -i $R/enc/film-master.mp4 -vf "scale=540:960:flags=lanczos" -crf 23 $SCRUB $SITE/hero-film-540.mp4
echo "== webm test copy $(date +%T)"
ffmpeg -v error -y -i $SITE/hero-film-720.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -g 8 -keyint_min 8 -row-mt 1 -cpu-used 2 -an $R/enc/hero-film-720.webm
echo "== posters $(date +%T)"
ffmpeg -v error -y -i $R/enc/film-master.mp4 -frames:v 1 -vf "scale=1080:1920" -q:v 2 $SITE/hero-poster-1080.jpg
ffmpeg -v error -y -i $R/enc/film-master.mp4 -frames:v 1 -vf "scale=720:1280" -q:v 3 $SITE/hero-poster-720.jpg
ffmpeg -v error -y -sseof -0.05 -i $R/enc/film-master.mp4 -update 1 -frames:v 1 -vf "scale=720:1280" -q:v 4 $SITE/hero-ending-720.jpg
echo "== room loop $(date +%T)"
ffmpeg -v error -y -i $R/masters/room.mp4 -filter_complex "[0:v]trim=0:3.2,setpts=PTS-STARTPTS,scale=540:960:flags=lanczos[f];[0:v]trim=0:3.2,setpts=PTS-STARTPTS,scale=540:960:flags=lanczos,reverse[r];[f][r]concat=n=2:v=1:a=0,format=yuv420p[v]" -map "[v]" -c:v libx264 -crf 26 -preset slow -g 60 -pix_fmt yuv420p -movflags +faststart -an -map_metadata -1 $SITE/room-loop.mp4
ffmpeg -v error -y -i $SITE/room-loop.mp4 -frames:v 1 -q:v 4 $SITE/room-poster.jpg
ffmpeg -v error -y -i $SITE/room-loop.mp4 -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -cpu-used 2 -an $R/enc/room-loop.webm
echo "== motion curve of the film (per 0.5s)"
ffmpeg -v info -i $SITE/hero-film-720.mp4 -vf "scale=180:-2,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG" -f null - 2>&1 | grep -o "YAVG=[0-9.]*" | cut -d= -f2 | awk '{s+=$1; n++; if(n%15==0){printf "%4.1f:%5.1f  ", (NR/30), s/15; s=0}}'; echo
ls -la $SITE/hero-film-720.mp4 $SITE/hero-film-540.mp4 $SITE/room-loop.mp4 $SITE/*.jpg $R/enc/
ffprobe -v error -show_entries format=duration:stream=nb_frames -of default=noprint_wrappers=1 $SITE/hero-film-720.mp4
echo FILMDONE
