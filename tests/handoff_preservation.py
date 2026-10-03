"""Current-base guard for every HTML file and all six complete practice banks.
Only replayable exact reviewed edits are allowed. No completion-chapter exclusions.
"""
from pathlib import Path
import subprocess, json, re, sys
ROOT=Path(__file__).resolve().parent.parent
BASE='5b0e619fb6838363a79dcb2966a6c138375a59ec'
JOURNAL=ROOT/'docs/edu-connect-handoff-2026-10-03/implementation/edit-journal.json'
def norm(s): return s.replace('\r\n','\n')
def old(file): return norm(subprocess.check_output(['git','show',f'{BASE}:{file}'],cwd=ROOT).decode())
def replay(file,source):
    for record in json.loads(JOURNAL.read_text('utf-8')):
        if record['file']!=file: continue
        assert source.count(record['before'])==record['count'],f"Stale journal: {file} {record['issue']} {record['before'][:60]}"
        source=source.replace(record['before'],record['after'])
    return source
def bank(source,file):
    if file=='TCCN-LuyenDe.html': return json.loads(re.search(r'<script id="question-data" type="application/json">([\s\S]*?)</script>',source)[1])
    return json.loads(re.search(r'const LOCAL_SETS = ([\s\S]*?);\n',source)[1])
def verify_source(file,actual):
    before=old(file);expected=replay(file,before)
    assert expected==actual,f'{file}: change outside exact reviewed journal'
    if '-LuyenDe.html' in file: assert bank(before,file)==bank(actual,file),f'{file}: question IDs, stems, options, answers, explanations or set config changed'
def check(files=None):
    files=files or [p.name for p in ROOT.glob('*.html')]
    for file in sorted(files):
        verify_source(file,norm((ROOT/file).read_text('utf-8')))
        print('PASS',file,'complete source and bank' if '-LuyenDe' in file else 'complete source')
    for file in ['auth.js','admin.js','firebase.json','database.rules.json','firestore.rules','firestore.indexes.json','.firebaserc']:
        assert old(file)==norm((ROOT/file).read_text('utf-8')),file+' auth/hosting/database contract changed'
    print('PASS auth, Firebase, rules and routes unchanged')
def negative_tests():
    file='KINH_TE_QUOC_TE.html';source=replay(file,old(file))
    # Strict full-source comparison rejects all of these, including completion chapters.
    for before,after in [('id="ch5"','id="ch500"'),('id="ch6"','id="ch600"'),('10%','11%')]:
        assert before in source,(file,before)
        try: verify_source(file,source.replace(before,after,1))
        except AssertionError: pass
        else: raise AssertionError('Guard accepted '+before+' mutation')
    for file in ['KTQT-LuyenDe.html','TCCN-LuyenDe.html']:
        data=bank(old(file),file)
        q=data[0]['questions'][0] if isinstance(data[0],dict) and 'questions' in data[0] else data[0]
        source=replay(file,old(file));original=q['answer']
        mutation=source.replace('"answer": '+str(original),'"answer": '+str((original+1)%len(q['options'])),1)
        assert mutation!=source
        try: verify_source(file,mutation)
        except AssertionError: pass
        else: raise AssertionError('Guard accepted '+file+' answer mutation')
    print('PASS negative guards: completion IDs, numeric fact and pilot/finance answer mutations')
if __name__=='__main__':
    check()
    if '--self-test' in sys.argv: negative_tests()
