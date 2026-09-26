"""Fail when a reviewed new question loses its local-theory support or answer mapping."""
from pathlib import Path
import json, re, sys, subprocess
sys.path.insert(0,str(Path(__file__).parent/'.python'))
import html5lib
root=Path(__file__).resolve().parent.parent
review=json.loads((root/'docs/practice-review/new-question-review.json').read_text(encoding='utf-8'))
def norm(s): return re.sub(r'\s+',' ',s).strip()
count=0
accounting_source=(root/'NguyenLyKeToan-LuyenDe.html').read_text(encoding='utf-8')
sets=json.loads(re.search(r'const LOCAL_SETS = ([\s\S]*?);\r?\n',accounting_source)[1])
finance_source=(root/'TCCN-LuyenDe.html').read_text(encoding='utf-8')
finance=json.loads(re.search(r'<script id="question-data" type="application/json">([\s\S]*?)</script>',finance_source)[1])
published={'accounting':next(s['questions'] for s in sets if s['id']=='quiz-applied-review-12'),'finance':[q for q in finance if q['id'].startswith('f2_')]}
for subject in ('accounting','finance'):
    tree=html5lib.parse((root/review['sources'][subject]).read_text(encoding='utf-8'))
    assert len(published[subject])==len(review[subject])==12
    for i,q in enumerate(review[subject]):
        chapter=next(el for el in tree.iter() if el.attrib.get('id')==q['chapter'])
        text=norm(' '.join(chapter.itertext()))
        assert norm(q['quote']) in text, f'{q["id"]}: missing theory evidence {q["quote"]}'
        assert len(q['options'])==len(set(q['options']))==4, f'{q["id"]}: invalid options'
        assert q['explanation'].strip(),q['id']
        item=next(p for p in published[subject] if p['id']==q['id'])
        assert item['question']==q['question'] and item['explanation']==q['explanation'],q['id']
        assert sorted(item['options'])==sorted(q['options']),q['id']
        assert item['options'][item['answer']]==q['options'][0],f'{q["id"]}: rotated answer mismatch'
        count+=1
print(f'PASS {count} new questions: local chapter evidence, distinct options, published wording and rotated answer keys')

pilot_path = root / 'docs/practice-review/pilot-questions-review.json'
if pilot_path.exists():
    pilot = json.loads(pilot_path.read_text(encoding='utf-8'))
    ktqt_source = (root / 'KTQT-LuyenDe.html').read_text(encoding='utf-8')
    ktqt_sets = json.loads(re.search(r'const LOCAL_SETS = ([\s\S]*?);\r?\n', ktqt_source)[1])
    nmlh_source = (root / 'NhapMonLuatHoc-LuyenDe.html').read_text(encoding='utf-8')
    nmlh_sets = json.loads(re.search(r'const LOCAL_SETS = ([\s\S]*?);\r?\n', nmlh_source)[1])
    published_pilot = {
        'ktqt': next(s['questions'] for s in ktqt_sets if s['id'] == 'ktqt-quiz-comprehensive'),
        'nmlh': next(s['questions'] for s in nmlh_sets if s['id'] == 'nmlh-quiz-comprehensive')
    }
    pilot_count = 0
    for subject in ('ktqt', 'nmlh'):
        tree = html5lib.parse((root / pilot['sources'][subject]).read_text(encoding='utf-8'))
        assert len(published_pilot[subject]) == len(pilot[subject]) == 20
        for q in pilot[subject]:
            chapter = next(el for el in tree.iter() if el.attrib.get('id') == q['chapter'])
            text = norm(' '.join(chapter.itertext()))
            assert norm(q['quote']) in text, f'{q["id"]}: missing theory evidence {q["quote"]}'
            assert len(q['options']) == len(set(q['options'])) == 4, f'{q["id"]}: invalid options'
            assert q['explanation'].strip(), q['id']
            item = next(p for p in published_pilot[subject] if p['id'] == q['id'])
            assert item['question'] == q['question'] and item['explanation'] == q['explanation'], q['id']
            assert sorted(item['options']) == sorted(q['options']), q['id']
            assert item['options'][item['answer']] == q['options'][0], f'{q["id"]}: rotated answer mismatch'
            pilot_count += 1
    print(f'PASS {pilot_count} pilot questions: local chapter evidence, distinct options, published wording and rotated answer keys')

pass03_path = root / 'docs/practice-review/pass03-questions-review.json'
if pass03_path.exists():
    pass03 = json.loads(pass03_path.read_text(encoding='utf-8'))
    nltttc_source = (root / 'NLTTTC-LuyenDe.html').read_text(encoding='utf-8')
    nltttc_sets = json.loads(re.search(r'const LOCAL_SETS = ([\s\S]*?);\r?\n', nltttc_source)[1])
    ltmqt_source = (root / 'LTMQT-LuyenDe.html').read_text(encoding='utf-8')
    ltmqt_sets = json.loads(re.search(r'const LOCAL_SETS = ([\s\S]*?);\r?\n', ltmqt_source)[1])
    published_pass03 = {
        'nltttc': next(s['questions'] for s in nltttc_sets if s['id'] == 'nltttc-quiz-comprehensive'),
        'ltmqt': next(s['questions'] for s in ltmqt_sets if s['id'] == 'ltmqt-quiz-comprehensive')
    }
    pass03_count = 0
    for subject in ('nltttc', 'ltmqt'):
        tree = html5lib.parse((root / pass03['sources'][subject]).read_text(encoding='utf-8'))
        assert len(published_pass03[subject]) == len(pass03[subject]) == 20
        for q in pass03[subject]:
            chapter = next(el for el in tree.iter() if el.attrib.get('id') == q['chapter'])
            text = norm(' '.join(chapter.itertext()))
            assert norm(q['quote']) in text, f'{q["id"]}: missing theory evidence {q["quote"]}'
            assert len(q['options']) == len(set(q['options'])) == 4, f'{q["id"]}: invalid options'
            assert q['explanation'].strip(), q['id']
            item = next(p for p in published_pass03[subject] if p['id'] == q['id'])
            assert item['question'] == q['question'] and item['explanation'] == q['explanation'], q['id']
            assert sorted(item['options']) == sorted(q['options']), q['id']
            assert item['options'][item['answer']] == q['options'][0], f'{q["id"]}: rotated answer mismatch'
            pass03_count += 1
    print(f'PASS {pass03_count} Pass 03 questions: local chapter evidence, distinct options, published wording and rotated answer keys')
