#!/usr/bin/env bash
# The Substrate — original audio assets (Task 18, SPEC §5.6).
# PROVENANCE: every file is synthesized here from ffmpeg oscillators and
# noise sources — original works, no third-party samples. This script IS
# the credit trail (P7 credits: "audio: original, synthesized in-repo").
# Regenerate: bash v2/tools/audio/gen_audio.sh
# NOTE: pinned to /usr/bin/ffmpeg (6.1.1, libvorbis) — the homebrew
# ffmpeg 8.1.2 on this box has no libvorbis and its native vorbis
# encoder emits 0-byte files (thread error -22).
set -euo pipefail
cd "$(dirname "$0")/../../.."
OUT=public/audio
mkdir -p "$OUT"
FF=/usr/bin/ffmpeg
V="-c:a libvorbis -ac 1 -ar 44100"

# ── bed-90s.ogg — dark room-tone: brown noise floor under two detuned
#    deep drones (55Hz A1 + 82.4Hz E2), slow 0.1Hz breathing LFO
#    (ffmpeg tremolo's minimum rate). Seamless loop: 96s rendered, tail
#    acrossfaded 6s into the head.
$FF -y -filter_complex "
anoisesrc=color=brown:seed=1337:duration=96:amplitude=0.28,
  lowpass=f=420,lowpass=f=420 [noise];
sine=frequency=55:duration=96,volume=0.16 [d1];
sine=frequency=82.4:duration=96,volume=0.10 [d2];
[noise][d1][d2] amix=inputs=3:normalize=0,
  tremolo=f=0.1:d=0.35, volume=0.9,
  asplit [a][b];
[a] atrim=0:90, asetpts=PTS-STARTPTS [head];
[b] atrim=90:96, asetpts=PTS-STARTPTS [tail];
[head][tail] acrossfade=d=6:c1=tri:c2=tri
" $V -q:a 2 "$OUT/bed-90s.ogg" 2>/dev/null

# ── sfx-leave.ogg (125ms) — high glass blip, fast expo decay
$FF -y -filter_complex "
sine=frequency=1244:duration=0.125,
  afade=t=in:d=0.004,afade=t=out:st=0.02:d=0.105:curve=exp,
  volume=0.5" $V -q:a 4 "$OUT/sfx-leave.ogg" 2>/dev/null

# ── sfx-enter.ogg (359ms) — two-tone rise (E5->B5), soft settle
$FF -y -filter_complex "
sine=frequency=659:duration=0.18, afade=t=in:d=0.006,
  afade=t=out:st=0.1:d=0.08:curve=exp [t1];
sine=frequency=988:duration=0.179, afade=t=in:d=0.006,
  afade=t=out:st=0.05:d=0.129:curve=exp, adelay=180 [t2];
[t1][t2] amix=inputs=2:normalize=0, volume=0.45" \
  $V -q:a 4 "$OUT/sfx-enter.ogg" 2>/dev/null

# ── sfx-arm.ogg (458ms) — filtered noise swell over a 220Hz undertone
$FF -y -filter_complex "
anoisesrc=color=pink:seed=7:duration=0.458:amplitude=0.4,
  bandpass=f=2400:w=1200, afade=t=in:d=0.2,
  afade=t=out:st=0.25:d=0.2:curve=exp [n];
sine=frequency=220:duration=0.458, afade=t=in:d=0.05,
  afade=t=out:st=0.2:d=0.25:curve=exp, volume=0.3 [u];
[n][u] amix=inputs=2:normalize=0, volume=0.5" \
  $V -q:a 4 "$OUT/sfx-arm.ogg" 2>/dev/null

# ── sfx-click.ogg (623ms) — low thock + tail resonance
$FF -y -filter_complex "
sine=frequency=140:duration=0.623, afade=t=in:d=0.002,
  afade=t=out:st=0.02:d=0.6:curve=exp [body];
anoisesrc=color=white:seed=23:duration=0.012:amplitude=0.5,
  highpass=f=2000 [tick];
[tick][body] amix=inputs=2:normalize=0, volume=0.55" \
  $V -q:a 4 "$OUT/sfx-click.ogg" 2>/dev/null

# ── sfx-decode.ogg (870ms) — granular tick cascade (5 bursts, thinning)
$FF -y -filter_complex "
anoisesrc=color=white:seed=41:duration=0.03:amplitude=0.5,
  highpass=f=3000, afade=t=out:st=0:d=0.03 [g1];
anoisesrc=color=white:seed=42:duration=0.025:amplitude=0.42,
  highpass=f=3200, afade=t=out:st=0:d=0.025, adelay=180 [g2];
anoisesrc=color=white:seed=43:duration=0.02:amplitude=0.36,
  highpass=f=3400, afade=t=out:st=0:d=0.02, adelay=380 [g3];
anoisesrc=color=white:seed=44:duration=0.018:amplitude=0.3,
  highpass=f=3600, afade=t=out:st=0:d=0.018, adelay=600 [g4];
anoisesrc=color=white:seed=45:duration=0.015:amplitude=0.24,
  highpass=f=3800, afade=t=out:st=0:d=0.015, adelay=820 [g5];
[g1][g2][g3][g4][g5] amix=inputs=5:normalize=0,
  apad=whole_dur=0.87, atrim=0:0.87, volume=0.5" \
  $V -q:a 4 "$OUT/sfx-decode.ogg" 2>/dev/null

echo "── durations ──"
for f in "$OUT"/*.ogg; do
  d=$(/usr/bin/ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  s=$(stat -c%s "$f")
  echo "$f  ${d}s  ${s}B"
done
echo "── total ──"
du -sb "$OUT"
