#!/usr/bin/env sh
# converts the locally installed display and body fonts to woff2 for the mockup.
# the output folder is git-ignored because TX-02 is a licensed font that must not be redistributed.
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
out="$here/mockups/fonts"
venv="${TMPDIR:-/tmp}/cloudark-fonts"
mkdir -p "$out"
[ -d "$venv" ] || python -m venv "$venv"
"$venv/bin/python" -m pip install -q fonttools brotli
"$venv/bin/python" -I - "$out" <<'PY'
import os, sys
from fontTools.ttLib import TTFont
out = sys.argv[1]
source = os.path.expanduser("~/Library/Fonts")
wanted = {
    "DepartureMono-Regular.otf": "departure-mono-regular.woff2",
    "TX-02-Regular.otf": "tx-02-regular.woff2",
    "TX-02-Medium.otf": "tx-02-medium.woff2",
    "Redaction-Regular.otf": "redaction-regular.woff2",
    "Redaction-Italic.otf": "redaction-italic.woff2",
    "Redaction35-Regular.otf": "redaction-35-regular.woff2",
    "Redaction35-Italic.otf": "redaction-35-italic.woff2",
    "Redaction50-Regular.otf": "redaction-50-regular.woff2",
    "Redaction50-Italic.otf": "redaction-50-italic.woff2",
}
for name, target in wanted.items():
    font = TTFont(os.path.join(source, name))
    font.flavor = "woff2"
    font.save(os.path.join(out, target))
    print(target)
PY
