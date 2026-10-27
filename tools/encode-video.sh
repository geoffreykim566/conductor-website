#!/usr/bin/env bash
# Turn a screen recording into the three files the page loads for one clip:
#   media/<name>.webm  AV1, the small one (browsers that can decode AV1 take this)
#   media/<name>.mp4   H.264 fallback (every browser), faststart so it plays while downloading
#   media/<name>.webp  poster: the first frame, shown instantly and when video can't play
#
# Usage:
#   tools/encode-video.sh <recording.mov> <name> [max-width]
#   tools/encode-video.sh --placeholder <name> "<label>" [width]
#
# Defaults: max-width 1600, 30 fps, no audio. Tune with CRF (H.264, default 24) and
# AV1_CRF (default 36): lower = sharper and bigger. UI text blurs first, so check it.
set -euo pipefail
export SVT_LOG=1   # AV1 encoder: errors only

cd "$(dirname "$0")/.."
mkdir -p media

if [[ "${1:-}" == "--placeholder" ]]; then
  name="$2"; label="$3"; width="${4:-1600}"
  height=$(( width * 10 / 16 ))            # Mac screens are 16:10
  dur=8
  src="$(mktemp -t conductor-placeholder).mp4"
  ffmpeg -hide_banner -loglevel error -y \
    -f lavfi -i "color=c=0x111114:s=${width}x${height}:r=30:d=${dur}" \
    -f lavfi -i "color=c=0xa855c7:s=160x4:r=30:d=${dur}" \
    -filter_complex "[0][1]overlay=x='mod(t*(W+160)/${dur}\,W+160)-160':y=H/2+48,drawtext=fontfile=/System/Library/Fonts/Menlo.ttc:text='${label}':fontcolor=0x8e8e93:fontsize=$(( width / 40 )):x=(w-tw)/2:y=(h-th)/2" \
    -c:v libx264 -crf 12 -pix_fmt yuv420p "$src"
  input="$src"; maxw="$width"
else
  input="$1"; name="$2"; maxw="${3:-1600}"
fi

vf="scale='min(${maxw},iw)':-2:flags=lanczos,fps=30,format=yuv420p"

ffmpeg -hide_banner -loglevel error -y -i "$input" -an -vf "$vf" \
  -c:v libx264 -preset slow -crf "${CRF:-24}" -profile:v high -movflags +faststart \
  "media/${name}.mp4"

ffmpeg -hide_banner -loglevel error -y -i "$input" -an -vf "$vf" \
  -c:v libsvtav1 -preset 6 -crf "${AV1_CRF:-36}" -g 240 \
  "media/${name}.webm"

ffmpeg -hide_banner -loglevel error -y -i "$input" -vf "$vf" -frames:v 1 \
  -c:v libwebp -quality 80 "media/${name}.webp"

[[ -n "${src:-}" ]] && rm -f "$src"
ls -lh "media/${name}".{webm,mp4,webp} | awk '{print $5, $9}'
