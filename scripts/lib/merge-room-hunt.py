"""Merge hand-written Room Hunt lines for a new dialect into the scenario and
vocab JSON (src/lib/games/room-hunt/). Source: content/room-hunt/<dialect>.txt

    ## common                 lines reused by several scenarios (y_tea, y_welcome...)
    key | arabic | transliteration
    ## cafe                   lines for scenarios/cafe.json (override common)
    key | arabic | transliteration
    ## vocab
    key | arabic | transliteration | m/f | question | question transliteration

Every key in every scenario must end up with a line, so nothing is half-done.
The NPC gender per dialect is npcGender in each scenario .ts file.

Usage: python3 -I scripts/lib/merge-room-hunt.py <dialect>
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RH = ROOT / "src/lib/games/room-hunt"


def main():
    dialect = sys.argv[1]
    sections = {}
    current = None
    for n, raw in enumerate((ROOT / "content/room-hunt" / f"{dialect}.txt").read_text(encoding="utf-8").splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#") and not line.startswith("## "):
            continue
        if line.startswith("## "):
            current = sections.setdefault(line[3:].strip(), {})
            continue
        parts = [p.strip() for p in line.split("|")]
        if re.search(r"[گچپڤ]", line):
            sys.exit(f"line {n}: non-standard letter")
        current[parts[0]] = parts[1:]
    common = sections.pop("common", {})
    vocab_src = sections.pop("vocab", {})
    errors = []
    writes = []
    for path in sorted((RH / "scenarios").glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        own = sections.get(path.stem, {})
        for key, forms in data.items():
            parts = own.get(key) or common.get(key)
            if not parts or len(parts) != 2:
                errors.append(f"{path.stem}: missing or bad line for {key}")
                continue
            forms[dialect] = {"arabic": parts[0], "transliteration": parts[1]}
        writes.append((path, data))
    vocab_path = RH / "vocab.json"
    vocab = json.loads(vocab_path.read_text(encoding="utf-8"))
    for key, forms in vocab.items():
        parts = vocab_src.get(key)
        if not parts or len(parts) != 5 or parts[2] not in ("m", "f"):
            errors.append(f"vocab: missing or bad line for {key}")
            continue
        forms[dialect] = {"arabic": parts[0], "transliteration": parts[1], "gender": parts[2], "question": parts[3], "questionTransliteration": parts[4]}
    writes.append((vocab_path, vocab))
    if errors:
        sys.exit("\n".join(errors))
    for path, data in writes:
        path.write_text(json.dumps(data, ensure_ascii=False, indent="\t") + "\n", encoding="utf-8")
    print(f"{dialect}: room hunt merged")


main()
