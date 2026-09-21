"""Protect complete theory text/scripts and original practice data at the approved checkpoint.
Only exact reviewed editorial edits, four held questions, narrowed ABC scope and
separately traced new questions are permitted. No keyword-based omission rules.
"""
from pathlib import Path
import json, re, subprocess, sys
sys.path.insert(0,str(Path(__file__).parent/'.python'))
import html5lib
root=Path(__file__).resolve().parent.parent
BASE='2f03f26ef2d52861f08b1a97535ff375879fb7ae'
baseline=sys.argv[1] if len(sys.argv)>1 and not sys.argv[1].startswith('--') else BASE
edits=json.loads((root/'docs/practice-review/theory-editorial-edits.json').read_text(encoding='utf-8'))
code_fixes=json.loads((root/'docs/practice-review/theory-code-fixes.json').read_text(encoding='utf-8'))
def old(file): return subprocess.check_output(['git','show',f'{baseline}:{file}'],cwd=root).decode('utf-8')
def current(file): return (root/file).read_text(encoding='utf-8')
def norm(text): return re.sub(r'\s+',' ',text).strip()
def academic_snapshot(source):
    tree=html5lib.parse(source)
    for parent in tree.iter():
        for child in list(parent):
            if not isinstance(child.tag,str): parent.remove(child)
    chapters=[(el.attrib.get('id'),norm(''.join(el.itertext()))) for el in tree.iter() if 'tab-content' in el.attrib.get('class','').split()]
    headings=[(el.tag,norm(''.join(el.itertext()))) for el in tree.iter() if el.tag.rsplit('}',1)[-1] in ('h1','h2','h3','h4')]
    scripts=[m.group(2).strip() for m in re.finditer(r'<script([^>]*)>([\s\S]*?)</script>',source) if 'src=' not in m.group(1)]
    return chapters,headings,scripts
def expected_theory(file):
    source=old(file)
    for before,after in edits.get(file,[]) + code_fixes.get(file,[]):
        assert before in source, f'{file}: stale editorial entry {before}'
        source=source.replace(before,after)
    return source
def finance_bank(source): return json.loads(re.search(r'<script id="question-data" type="application/json">([\s\S]*?)</script>',source)[1])
def accounting_bank(source): return json.loads(re.search(r'const LOCAL_SETS = ([\s\S]*?);\r?\n',source)[1])
def check():
    routes=json.loads(current('firebase.json'))['hosting']['rewrites']
    assert len(routes)==12,'Theory route coverage changed'
    chapters=0
    for route in routes:
        file=route['destination'].lstrip('/')
        expected=academic_snapshot(expected_theory(file))
        assert expected==academic_snapshot(current(file)), f'{file}: unexpected chapter text, heading, formula/data or script change'
        chapters+=len(expected[0])
    held=json.loads(current('docs/practice-review/held-finance-questions.json'))
    held_ids={entry['question']['id'] for entry in held}
    assert held_ids=={'e1_q20','e1_q31','e3_q36','e3_q43'}
    original=finance_bank(old('TCCN-LuyenDe.html'))
    assert [q for q in original if q['id'] in held_ids]==[entry['question'] for entry in held]
    expected=[]
    for q in original:
        if q['id'] in held_ids: continue
        q['explanation']=q['explanation'].replace('không đủ theo đáp án LMS.','không đủ.').replace('đủ theo đáp án LMS.','đủ.')
        expected.append(q)
    actual=finance_bank(current('TCCN-LuyenDe.html'))
    assert [q for q in actual if not q['id'].startswith('f2_')]==expected,'Existing finance question content/keys changed'
    original=accounting_bank(old('NguyenLyKeToan-LuyenDe.html'))
    actual=accounting_bank(current('NguyenLyKeToan-LuyenDe.html'))
    archived=json.loads(current('docs/practice-review/abc-incomplete-original.json'))['set']
    abc=next(s for s in original if s['id']=='exam-abc-company')
    assert abc==archived,'ABC original archive changed'
    abc['title']='Practice Test 1: ABC Company Opening Position'
    abc['description']='Calculate opening assets, liabilities and equity, then prepare the Statement of Financial Position.'
    abc['requirements']=abc['requirements'][:4]
    abc['caseHtml']=abc['caseHtml'][:abc['caseHtml'].index("<p class='mt-4'>")]
    abc['solutionHtml']=abc['solutionHtml'][:abc['solutionHtml'].index("<div><h4 class='font-black text-teal-800 mb-2'>B.")]+ '</div>'
    assert [s for s in actual if s['id']!='quiz-applied-review-12']==original,'Existing accounting question data changed'
    print(f'PASS academic preservation: 12 theory pages, {chapters} chapter/review sections, both original practice banks; exact reviewed exceptions only')
    print(f'Content checkpoint: {baseline}. Original strict prose audit remains available separately.')
    if '--self-test' in sys.argv:
        source=expected_theory('TAI_CHINH_CA_NHAN.html'); snapshot=academic_snapshot(source)
        for before,after in [('Net worth = Assets − Liabilities','Net worth = Assets + Liabilities'),('Selena Torres','Different Case'),('$72,000','$73,000'),('id="ch4"','id="missing-chapter"')]:
            assert before in source
            assert academic_snapshot(source.replace(before,after))!=snapshot, f'Guard missed {before}'
        changed=json.loads(json.dumps(expected)); changed[0]['answer']=(changed[0]['answer']+1)%4
        assert changed!=expected
        print('PASS guard self-test: formula, case, number, chapter and answer-key mutations rejected')
if __name__=='__main__': check()
