#!/bin/bash
# Turns the three iPhone HLG clips into stabilized SDR masters (1080x1920, 30fps, no metadata, no audio).
set -e
R=/home/user/Motion-graphic-websites/review/yoko-ono
TM="zscale=t=linear:npl=1000,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0:peak=10,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"
for n in walk1 walk2 room; do
  echo "== $n detect $(date +%T)"
  ffmpeg -v error -y -i $R/raw/$n.mov -vf "fps=30,format=yuv420p,vidstabdetect=shakiness=6:accuracy=15:stepsize=4:result=$R/masters/$n.trf" -f null -
  echo "== $n transform+tonemap $(date +%T)"
  ffmpeg -v error -y -i $R/raw/$n.mov -vf "fps=30,$TM,vidstabtransform=input=$R/masters/$n.trf:smoothing=24:zoom=5:optzoom=1:crop=black:interpol=bicubic,unsharp=5:5:0.35" -c:v libx264 -crf 14 -preset medium -pix_fmt yuv420p -map_metadata -1 -an $R/masters/$n.mp4
  echo "== $n done $(date +%T)"
done
echo ALLDONE
