"""Build a dialect's Daily Root words (src/lib/data/daily-root/dialects/<dialect>.json)
from content/daily-root/<dialect>.txt.

Every dialect uses the same roots as the Fusha set (roots.json), in the same
order, so everyone gets the same root on the same day. Only the words change:

    # ك ت ب
    كاتب kaatib writer
    كتاب ktaab book

Each word line is the Arabic (no tashkeel; the root's own letters kept, so
ثلاجة not تلاجة), the transliteration (one token), then the English.

Usage: python3 -I scripts/lib/build-daily-root.py <dialect>
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main(dialect: str) -> None:
    roots = [r["root"] for r in json.loads((ROOT / "src/lib/data/daily-root/roots.json").read_text())]
    out: dict[str, list[list[str]]] = {}
    current = None
    for n, line in enumerate((ROOT / f"content/daily-root/{dialect}.txt").read_text().splitlines(), 1):
        line = line.strip()
        if not line:
            continue
        if line.startswith("#"):
            current = line[1:].strip()
            if current in out:
                sys.exit(f"line {n}: {current} twice")
            out[current] = []
            continue
        parts = line.split(maxsplit=2)
        if current is None or len(parts) != 3:
            sys.exit(f"line {n}: expected 'arabic translit english': {line}")
        out[current].append(parts)

    missing = [r for r in roots if r not in out]
    extra = [r for r in out if r not in roots]
    if missing or extra:
        sys.exit(f"missing roots: {missing}\nunknown roots: {extra}")

    dest = ROOT / f"src/lib/data/daily-root/dialects/{dialect}.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    ordered = {r: out[r] for r in roots}
    lines = ",\n".join(f"\t{json.dumps(r, ensure_ascii=False)}: {json.dumps(w, ensure_ascii=False)}" for r, w in ordered.items())
    dest.write_text("{\n" + lines + "\n}\n")
    print(f"{dest.relative_to(ROOT)}: {len(ordered)} roots, {sum(len(w) for w in ordered.values())} words")


if __name__ == "__main__":
    main(sys.argv[1])
