"""Build phrasebook JSON (src/lib/data/phrases/<dialect>/<slug>.json) from a
hand-written source file, content/phrases/<dialect>.txt.

Source format, one block per phrase:

    ## hello
    arabic | transliteration | literal gloss
    usage: When to use it...
    V: label | arabic | transliteration | english | note
    R: arabic | transliteration | english
    E: arabic | transliteration | english

`english` comes from PHRASE_SEEDS, `arabicPlain` is the Arabic without tashkeel,
and `franco` is the transliteration (already chat-alphabet). Every seed slug must
be present.

Usage: python3 -I scripts/lib/build-phrases.py <dialect>
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TASHKEEL = re.compile(r"[ً-ْٰـ]")


def seeds():
    text = (ROOT / "src/lib/constants/phrase-seeds.ts").read_text(encoding="utf-8")
    out = {}
    for slug, quote, english in re.findall(r"slug: '([^']+)',\s*english: (['\"])(.*?)\2", text):
        out[slug] = english
    return out


def split(line, n, where):
    parts = [p.strip() for p in line.split("|")]
    if len(parts) != n or not all(parts):
        sys.exit(f"{where}: expected {n} fields, got: {line}")
    return parts


def main():
    dialect = sys.argv[1]
    src = (ROOT / "content/phrases" / f"{dialect}.txt").read_text(encoding="utf-8")
    english_for = seeds()
    blocks = re.split(r"^## ", src, flags=re.M)[1:]
    out_dir = ROOT / "src/lib/data/phrases" / dialect
    out_dir.mkdir(parents=True, exist_ok=True)
    done = set()
    for block in blocks:
        lines = [l.strip() for l in block.strip().splitlines() if l.strip() and not l.strip().startswith("#")]
        slug = lines[0]
        where = f"{dialect}/{slug}"
        if slug not in english_for:
            sys.exit(f"{where}: not a phrase seed")
        arabic, translit, literal = split(lines[1], 3, where)
        entry = {
            "slug": slug,
            "dialect": dialect,
            "english": english_for[slug],
            "arabic": arabic,
            "arabicPlain": TASHKEEL.sub("", arabic),
            "transliteration": translit,
            "franco": translit,
            "literal": literal,
            "usage": "",
            "variants": [],
            "responses": [],
            "examples": [],
        }
        for line in lines[2:]:
            tag, _, rest = line.partition(":")
            rest = rest.strip()
            if tag == "usage":
                entry["usage"] = rest
            elif tag == "V":
                label, a, t, e, note = split(rest, 5, where)
                entry["variants"].append({"label": label, "arabic": a, "transliteration": t, "english": e, "note": note})
            elif tag in ("R", "E"):
                a, t, e = split(rest, 3, where)
                entry["responses" if tag == "R" else "examples"].append({"arabic": a, "transliteration": t, "english": e})
            else:
                sys.exit(f"{where}: unknown line: {line}")
        if not entry["usage"] or len(entry["examples"]) < 2 or not entry["responses"]:
            sys.exit(f"{where}: needs usage, responses and at least 2 examples")
        for text in [arabic] + [x["arabic"] for k in ("variants", "responses", "examples") for x in entry[k]]:
            if re.search(r"[گچپڤ]", text):
                sys.exit(f"{where}: non-standard letter in {text}")
        (out_dir / f"{slug}.json").write_text(json.dumps(entry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        done.add(slug)
    missing = set(english_for) - done
    if missing:
        sys.exit(f"{dialect}: missing phrases: {sorted(missing)}")
    print(f"{dialect}: {len(done)} phrases written to {out_dir.relative_to(ROOT)}")


main()
