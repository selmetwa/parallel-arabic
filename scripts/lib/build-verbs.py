"""Build verb conjugation JSON (src/lib/data/verb-conjugations/<dialect>/) for
Iraqi, Khaleeji and Saudi (Hijazi) from content/verbs/<dialect>.txt.

The 72 verbs and their English glosses are the same in every dialect, so the
English for each form, the root letters and the verb class are copied from the
Levantine files. Only the Arabic and transliteration are written by hand:

    ## slug
    S: <past stem> <past translit before consonant> <before vowel> | <present stem> <present translit stem> <prefix vowel or ->
    past: ar/tr; ar/tr; ... (8 persons: ana enta enti howa heya ehna entu homma)
    present: ...            8 bare present forms (overrides S)
    present!: ...           present used as-is, no tense prefix (e.g. "I have")
    future!: ...            future used as-is
    tail: عن/3an            preposition appended to every form
    note: ...

The present tense gets the dialect's prefix (Hijazi b-) and the future its
particle (Iraqi/Gulf راح, Hijazi ح-); negatives put ما in front.

Usage: python3 -I scripts/lib/build-verbs.py <dialect>
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "src/lib/data/verb-conjugations"
PERSONS = ["ana", "enta", "enti", "howa", "heya", "ehna", "entu", "homma"]

# Suffixes per dialect: (arabic, translit) for each person.
PAST = {
    "iraqi": [("ت", "it"), ("ت", "it"), ("تي", "ti"), ("", ""), ("ت", "at*"), ("نا", "na"), ("توا", "tu"), ("وا", "aw*")],
    "khaleeji": [("ت", "t"), ("ت", "t"), ("تي", "ti"), ("", ""), ("ت", "at*"), ("نا", "na"), ("توا", "taw"), ("وا", "aw*")],
    "saudi": [("ت", "t"), ("ت", "t"), ("تي", "ti"), ("", ""), ("ت", "at*"), ("نا", "na"), ("توا", "tu"), ("وا", "u*")],
}
GULF_PRESENT = [("ا", "a", ""), ("ت", "t", ""), ("ت", "t", "ين/een"), ("ي", "y", ""), ("ت", "t", ""), ("ن", "n", ""), ("ت", "t", "ون/oon"), ("ي", "y", "ون/oon")]
PRESENT = {
    "iraqi": GULF_PRESENT,
    "khaleeji": GULF_PRESENT,
    "saudi": [("ا", "a", ""), ("ت", "t", ""), ("ت", "t", "ي/i"), ("ي", "y", ""), ("ت", "t", ""), ("ن", "n", ""), ("ت", "t", "وا/u"), ("ي", "y", "وا/u")],
}


def pairs(text, where):
    out = []
    for p in text.split(";"):
        ar, _, tr = p.strip().partition("/")
        if not ar.strip() or not tr.strip():
            sys.exit(f"{where}: bad form '{p}'")
        out.append((ar.strip(), tr.strip()))
    if len(out) != 8:
        sys.exit(f"{where}: expected 8 forms, got {len(out)}")
    return out


def from_template(dialect, spec, where):
    past_part, _, pres_part = spec.partition("|")
    p_ar, p_c, p_v = past_part.split()
    s_ar, s_tr, vowel = pres_part.split()
    vowel = "" if vowel == "-" else vowel
    past = []
    for ar_suf, tr_suf in PAST[dialect]:
        if tr_suf.endswith("*"):
            past.append((p_ar + ar_suf, p_v + tr_suf[:-1]))
        else:
            past.append((p_ar + ar_suf, p_c + tr_suf))
    present = []
    for i, (pre_ar, pre_tr, suf) in enumerate(PRESENT[dialect]):
        suf_ar, _, suf_tr = suf.partition("/")
        tr = "a" + s_tr if i == 0 else pre_tr + vowel + s_tr
        present.append((pre_ar + s_ar + suf_ar, tr + suf_tr))
    return past, present


def present_prefix(dialect, form):
    ar, tr = form
    if dialect != "saudi":
        return form
    first, _, rest = ar.partition(" ")
    if first.startswith(("أ", "ا", "آ")):
        first = "با" + first[1:]
    else:
        first = "ب" + first
    return ((first + (" " + rest if rest else "")), "b" + tr)


def future(dialect, form, person):
    ar, tr = form
    if dialect != "saudi":
        return ("راح " + ar, "raa7 " + tr)
    first, _, rest = ar.partition(" ")
    if first.startswith(("أ", "ا", "آ")):
        first = "حا" + first[1:]
        tr = "7a" + tr[1:] if tr.startswith("a") else "7a" + tr
    else:
        first = "ح" + first
        tr = "7a" + tr
    return (first + (" " + rest if rest else ""), tr)


def neg(form):
    return ("ما " + form[0], "ma " + form[1])


def main():
    dialect = sys.argv[1]
    src = (ROOT / "content/verbs" / f"{dialect}.txt").read_text(encoding="utf-8")
    out_dir = DIR / dialect
    out_dir.mkdir(parents=True, exist_ok=True)
    index = []
    done = set()
    for block in re.split(r"^## ", src, flags=re.M)[1:]:
        lines = [l.strip() for l in block.strip().splitlines() if l.strip() and not l.strip().startswith("#")]
        slug = lines[0]
        where = f"{dialect}/{slug}"
        ref_path = DIR / "levantine" / f"{slug}.json"
        if not ref_path.exists():
            sys.exit(f"{where}: unknown verb slug")
        ref = json.loads(ref_path.read_text(encoding="utf-8"))
        fields = {}
        for line in lines[1:]:
            key, _, val = line.partition(":")
            fields[key.strip()] = val.strip()
        past = present = None
        if "S" in fields:
            past, present = from_template(dialect, fields["S"], where)
        if "past" in fields:
            past = pairs(fields["past"], where)
        if "present" in fields:
            present = pairs(fields["present"], where)
        if past is None or (present is None and "present!" not in fields):
            sys.exit(f"{where}: needs past and present")
        pres_aff = pairs(fields["present!"], where) if "present!" in fields else [present_prefix(dialect, f) for f in present]
        if "future!" in fields:
            fut_aff = pairs(fields["future!"], where)
        else:
            fut_aff = [future(dialect, f, p) for f, p in zip(present, PERSONS)]
        tail = fields.get("tail")
        def add_tail(forms):
            if not tail:
                return forms
            t_ar, _, t_tr = tail.partition("/")
            return [(a + " " + t_ar, t + " " + t_tr) for a, t in forms]
        tenses = {"past": add_tail(past), "present": add_tail(pres_aff), "future": add_tail(fut_aff)}
        conj = {}
        for tense, aff in tenses.items():
            conj[tense] = {}
            for pol, forms in (("affirmative", aff), ("negative", [neg(f) for f in aff])):
                ref_forms = ref["conjugations"][tense][pol]
                conj[tense][pol] = [
                    {"person": p, "arabic": a, "transliteration": t, "english": r["english"]}
                    for p, (a, t), r in zip(PERSONS, forms, ref_forms)
                ]
        for tense in conj.values():
            for forms in tense.values():
                for f in forms:
                    if not re.fullmatch(r"[؀-ۿ ]+", f["arabic"]) or re.search(r"[گچپڤ]", f["arabic"]):
                        sys.exit(f"{where}: bad arabic {f['arabic']}")
                    if not re.fullmatch(r"[a-z0-9 ]+", f["transliteration"]):
                        sys.exit(f"{where}: bad transliteration {f['transliteration']}")
        base_ar, base_tr = tenses["past"][3]
        entry = {
            "slug": slug,
            "arabic": base_ar,
            "transliteration": base_tr,
            "english": ref["english"],
            "wordId": None,
            "rootLetters": ref["rootLetters"],
            "verbClass": ref["verbClass"],
            "notes": fields.get("note") or f"Past {base_tr}, present {tenses['present'][0][1]} (I {ref['english'].removeprefix('to ')}).",
            "conjugations": conj,
        }
        (out_dir / f"{slug}.json").write_text(json.dumps(entry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        index.append({k: entry[k] for k in ("slug", "arabic", "transliteration", "english", "wordId", "rootLetters", "verbClass")})
        done.add(slug)
    expected = {p.stem for p in (DIR / "levantine").glob("*.json") if p.stem != "index"}
    missing = expected - done
    if missing:
        sys.exit(f"{dialect}: missing verbs: {sorted(missing)}")
    index.sort(key=lambda v: v["english"])
    (out_dir / "index.json").write_text(
        json.dumps({"dialect": dialect, "generatedAt": datetime.now(timezone.utc).isoformat(), "verbs": index}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{dialect}: {len(done)} verbs written")


main()
