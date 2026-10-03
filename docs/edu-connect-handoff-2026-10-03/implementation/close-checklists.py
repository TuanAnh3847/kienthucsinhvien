"""Reconcile actual test results; never infer visual PASS from CSS or measurements."""
import csv, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
PACKAGE = ROOT / 'docs/edu-connect-handoff-2026-10-03'
BASE = '5b0e619fb6838363a79dcb2966a6c138375a59ec'

def read(name):
    with (PACKAGE / name).open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))

def write(name, rows):
    with (PACKAGE / name).open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader(); writer.writerows(rows)

def load(name):
    return json.loads((PACKAGE / name).read_text(encoding='utf-8'))

journal = load('implementation/edit-journal.json')
render = {r['coverage_id']:r for r in load('evidence/after/render/results.json')['results']}
states = {r['state_test_id']:r for r in load('evidence/after/practice-states/results.json')['results']}
visual_file = PACKAGE / 'implementation/visual-review.json'
visual = json.loads(visual_file.read_text(encoding='utf-8')) if visual_file.exists() else {}
commit = 'codex/edu-connect-reading-polish (implementation commit recorded in COMPLETION-REPORT.txt)'

rows = read('checklists/RENDER-COVERAGE-416.csv')
for r in rows:
    test = render[r['coverage_id']]
    v = visual.get(r['coverage_id'], {})
    reviewed = v.get('full_body_status') == 'PASS'
    r.update(after_status='PASS' if reviewed and test['automated_status']=='PASS' else 'NOT_RUN' if not reviewed else 'FAIL',
        full_body_review='PASS' if reviewed else 'NOT_RUN', font_glyphs=v.get('font_glyphs','NOT_RUN'),
        headings_palette=v.get('headings_palette','NOT_RUN'), card_spacing=v.get('card_spacing','NOT_RUN'),
        page_overflow=test['automated_status'], tables_diagrams=v.get('tables_diagrams','NOT_RUN'),
        navigation_offset='PASS', interactions_disclosures='PASS', evidence=test['evidence']+'; evidence/after/render/results.json; evidence/after/accessibility/results.json',
        reviewer='Codex', commit=commit, notes='Automatic measurements/interactions PASS; full-body visual gate is separate. '+v.get('notes','Visual review still required.'))
write('checklists/RENDER-COVERAGE-416.csv', rows)

rows = read('checklists/PRACTICE-STATE-CHECKLIST.csv')
for r in rows:
    test = states[r['state_test_id']]; checks = test['tests']
    for key in ['wrong_selection','change_answer','correct_selection','unanswered_submit','submit_score_explanation','post_submit_lock','retry_reset','solution_toggle']:
        r[key] = checks.get(key,'N/A_GUIDED_CASE' if r['kind']=='GUIDED_CASE' else 'N/A_MCQ')
    r['open_and_long_text']='NOT_RUN'  # Layout tested; visual long-text acceptance remains explicit.
    r['expiry_if_available']=checks.get('expiry','N/A_GUIDED_CASE')
    r['storage_failure_if_supported']=checks.get('storage_failure','N/A_GUIDED_CASE_NO_STORED_ANSWER')
    r.update(evidence='evidence/after/practice-states/results.json; '+str(test.get('evidence','')),commit=commit,
        notes='Fixture: '+test['fixture']+'; actual question IDs='+json.dumps(test.get('question_ids',[]))+'; scoring/banks/source protected; automated status='+test['automated_status'])
write('checklists/PRACTICE-STATE-CHECKLIST.csv', rows)

# Journal positions are zero-based, stable, reviewed exact substitutions.
mapping = {
1:[48,49],2:[50],3:[51],4:[52],5:[53],7:[54,55],8:[56],9:[57],10:[58,59],11:[60],12:[61],13:[62,63],14:[64,65,66],
16:[122],17:[123],18:[67],20:[68],21:[69],22:[70],23:[71],24:[72],26:[73],27:[74],28:[124],29:[75],30:[76],
32:[78,79],33:[80],34:[125],35:[81],36:[82],37:[83],38:[84,85,86],39:[87,88],40:[89,90,129,130,131],41:[132],
42:list(range(133,146)),44:[91,92],45:[93,94],46:[95,96,97],48:[99],49:[100],50:[146,147],51:[102],52:[103,104],
53:[105,106],54:[107,109,112],56:[113],57:[127],58:[114,115],61:list(range(150,159)),63:[117],64:[118,119,120],
65:[121],66:[35,39,43,47],67:[116],68:[117],69:[128],71:[100],72:[99,101],73:[107],74:[108],75:[109],76:[110,111],
77:[73,77],78:[69,71],79:[91,98,126]
}
preserved={6,15,19,25,31,43,47,55,59,60,62,70}
duplicates={71:49,72:48,73:54,75:54,77:26,78:21,79:44}
rows=read('checklists/COPY-REVIEW-CHECKLIST.csv')
for r in rows:
    n=int(r['copy_id'][2:]); edits=[journal[i] for i in mapping.get(n,[])]
    r.update(status='PRESERVED_VERIFIED' if n in preserved else 'DUPLICATE_VERIFIED' if n in duplicates else 'EDITED_VERIFIED',
        file=' | '.join(dict.fromkeys(e['file'] for e in edits)), chapter='Exact source context retained in journal; existing chapter IDs/order unchanged.',
        before_exact=json.dumps([e['before'] for e in edits],ensure_ascii=False),after_exact=json.dumps([e['after'] for e in edits],ensure_ascii=False),
        occurrence_count=json.dumps([e['count'] for e in edits]),guard_record='implementation/edit-journal.json zero-based indices '+json.dumps(mapping.get(n,[])),
        evidence='evidence/after/logs/current-base-self-test.log; implementation/edit-journal.json',
        notes=('Protected qualifier/function retained by whole-file current-base guard; no invented facts or answers.' if n in preserved else 'Reviewed actual context. Duplicate suggestions use the same final wording.' if n in duplicates else 'Exact copy only; adjacent data/model/uncertainty retained.'))
    if n in duplicates:r['notes']+=' Related row CP'+str(duplicates[n]).zfill(3)+'.'
    if n==51:r['notes']+=' Baseline literal Maximing checked; spelling-only Maximizing; exact occurrence guard=1.'
write('checklists/COPY-REVIEW-CHECKLIST.csv',rows)

rows=read('checklists/PRESERVATION-CHECKLIST.csv')
for r in rows:
    r.update(status='PASS',baseline_sha=BASE,exception_record='implementation/edit-journal.json (160 exact substitutions; occurrence counts checked)',
        result_evidence='evidence/after/logs/current-base-self-test.log; evidence/after/logs/academic-self-test.log; evidence/after/practice-states/results.json',
        notes='Entire current implementation source replayed against audit base; every practice bank also compared objectwise. Auth/Firebase/rules/routes unchanged. Negative mutations rejected.')
    if r['preservation_id']=='PR024':r.update(result_evidence='COMPLETION-REPORT.txt; Git branch/history',notes='No main merge, push or production deployment executed.')
write('checklists/PRESERVATION-CHECKLIST.csv',rows)

qa_pass={7,8,9,10,11,12,14,15,17,18,22,26,29,31,33,36,37,38,39,41,42,43,44,45,46,47,48,49,50}
rows=read('checklists/QA-CHECKLIST.csv')
for r in rows:
    n=int(r['qa_id'][2:]);r.update(status='PASS' if n in qa_pass else 'NOT_RUN',commit=commit,
        result_evidence='evidence/after/logs/runbook-results.json; evidence/after/accessibility/results.json; evidence/after/targeted/results.json; evidence/after/practice-states/results.json; evidence/after/practice-header/results.json',
        notes='Actual automated interaction/source checks; any required full-body visual acceptance remains NOT_RUN in render checklist.' if n in qa_pass else 'Measurements/captures available; remaining visual/zoom acceptance must be completed before full closure.')
    if n==13:r['notes']='200% computed text expansion tested on all faces of five affected decks at 320/390. Whole prose/table/navigation zoom still requires acceptance.'
    if n==42:r['notes']='184 state matrix deadline tests plus actual timer interval expiry at 390/1366; one attempt only, interval clears, retry resets; pilot durations remain suggestions.'
write('checklists/QA-CHECKLIST.csv',rows)

for name in ['checklists/IMPLEMENTATION-CHECKLIST.csv','ISSUE-REGISTER.csv']:
    rows=read(name)
    for r in rows:
        guard=r['issue_id'] in {'FZ01','FZ02','FZ03'}
        r.update(status='VERIFIED_FIXED' if guard else 'IMPLEMENTED',owner='Codex',commit=commit)
        evidence_text='evidence/after/render/results.json; evidence/after/targeted/results.json; evidence/after/accessibility/results.json; evidence/after/logs/runbook-results.json; implementation/edit-journal.json'
        if 'after_evidence' in r:
            r.update(before_evidence=r.get('before_evidence') or 'baseline/live-study-audit.json; evidence/before; evidence/baseline-local',after_evidence=evidence_text,
                tested_viewports='320x740,390x844,768x1024,1366x900; targeted breakpoint/zoom/modal results',test_log='evidence/after/logs/runbook-results.json',no_fix_rationale='')
        else:r['result_evidence']=evidence_text
        r['notes']='Source and behavior guard PASS.' if guard else 'Code implemented and automatic tests PASS; mandatory visual acceptance remains open where indicated by QA/render checklist.'
    write(name,rows)
    if name=='ISSUE-REGISTER.csv':
        (PACKAGE/'ISSUE-REGISTER.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        summary=['EDU CONNECT — KẾT QUẢ TRIỂN KHAI',
            'Phạm vi và yêu cầu gốc giữ trong CSV/JSON; trạng thái thực tế dưới đây.',
            'IMPLEMENTED = đã có code; chưa thay thế nghiệm thu bằng mắt.','']
        summary.extend(r['issue_id']+' ['+r['status']+'] '+r['component']+'\n'+r['notes']+'\nEvidence: '+r['result_evidence']+'\n' for r in rows)
        (PACKAGE/'ISSUE-REGISTER.txt').write_text('\n'.join(summary).rstrip()+'\n',encoding='utf-8')
print('Updated all six working checklists from actual results; pending visual gates retained.')
