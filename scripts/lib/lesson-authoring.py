"""Expand a hand-written lesson draft into the v2 lesson source JSON.

usage: python3 -I scripts/lib/lesson-authoring.py DRAFT.txt OUT.json

Writing every sentence word by word keeps the four parallel fields (arabic,
arabicTashkeel, transliteration, wordAlignments) consistent by construction.

Draft format (blank lines and lines starting with # are ignored):

    @vocab
    <pos>[:<gender>] = <English gloss>
    <word> | <word> | ...
    @pool
    <English sentence> = <gloss>; <gloss>     (the targetWords, from @vocab)
    <word> | <word> | ...
    @passage <title>
    <English sentence>
    <word> | <word> | ...
    @scenario
    situation: ...
    studentRole: ...
    otherRole: ...
    goalEnglish: ...
    targetWords: <gloss>; <gloss>

Each <word> is `tashkeel / transliteration / gloss`. The clean `arabic` is
the tashkeel form with harakat removed, except a word written with a leading
`!` keeps them (e.g. !شلونِك to tell the feminine apart, as existing lessons do).
"""
import json
import re
import sys

HARAKAT = re.compile('[ً-ْٰ]')


def parse_words(line):
    words = []
    for chunk in line.split('|'):
        parts = [p.strip() for p in chunk.split('/')]
        if len(parts) != 3:
            raise ValueError(f'bad word {chunk!r} in {line!r}')
        tashkeel, translit, gloss = parts
        keep = tashkeel.startswith('!')
        tashkeel = tashkeel.lstrip('!')
        clean = tashkeel if keep else HARAKAT.sub('', tashkeel)
        words.append((clean, tashkeel, translit, gloss))
    return words


def sentence(english, words):
    return {
        'arabic': ' '.join(w[0] for w in words),
        'arabicTashkeel': ' '.join(w[1] for w in words),
        'english': english,
        'transliteration': ' '.join(w[2] for w in words),
        'wordAlignments': [{'arabic': w[0], 'english': w[3], 'transliteration': w[2]} for w in words],
    }


def main(draft_path, out_path):
    lines = [l.rstrip() for l in open(draft_path, encoding='utf-8')]
    lines = [l for l in lines if l.strip() and not l.lstrip().startswith('#')]
    out = {'vocab': [], 'pool': [], 'passages': [], 'scenario': None}
    section = None
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith('@'):
            section, _, rest = line[1:].partition(' ')
            if section == 'passage':
                out['passages'].append({'title': rest.strip(), 'sentences': []})
            if section == 'scenario':
                out['scenario'] = {}
            i += 1
            continue
        if section == 'scenario':
            key, _, value = line.partition(':')
            value = value.strip()
            out['scenario'][key.strip()] = [v.strip() for v in value.split(';')] if key.strip() == 'targetWords' else value
            i += 1
            continue
        header, words = line, parse_words(lines[i + 1])
        i += 2
        if section == 'vocab':
            meta, _, gloss = header.partition('=')
            pos, _, gender = meta.strip().partition(':')
            item = sentence(gloss.strip(), words)
            item['partOfSpeech'] = pos
            if gender:
                item['gender'] = gender
            out['vocab'].append(item)
        elif section == 'pool':
            english, _, targets = header.rpartition('=')
            item = sentence(english.strip(), words)
            item['targetWords'] = [t.strip() for t in targets.split(';') if t.strip()]
            out['pool'].append(item)
        elif section == 'passage':
            out['passages'][-1]['sentences'].append(sentence(header.strip(), words))
    json.dump(out, open(out_path, 'w', encoding='utf-8'), ensure_ascii=False, indent='\t')
    open(out_path, 'a', encoding='utf-8').write('\n')
    print(f"{out_path}: {len(out['vocab'])} vocab, {len(out['pool'])} sentences, {len(out['passages'])} passages")


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
