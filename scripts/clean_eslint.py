#!/usr/bin/env python3
"""Remove unused eslint-disable comment directives from source files."""
import re
import sys
from pathlib import Path

PATTERNS = [
    r'\s*//\s*eslint-disable-next-line\s+@next/next/no-img-element\s*$',
    r'\s*//\s*eslint-disable-next-line\s+react-hooks/exhaustive-deps\s*$',
]

def clean(path: Path):
    text = path.read_text()
    lines = text.split("\n")
    out = []
    changed = False
    for line in lines:
        stripped = line.rstrip()
        skip = False
        for pat in PATTERNS:
            if re.match(pat, stripped):
                skip = True
                changed = True
                break
        if not skip:
            out.append(line)
    if changed:
        path.write_text("\n".join(out))
        print(f"cleaned: {path}")

for f in sys.argv[1:]:
    p = Path(f)
    if p.exists():
        clean(p)
