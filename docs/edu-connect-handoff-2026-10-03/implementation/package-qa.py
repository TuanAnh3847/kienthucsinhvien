"""Build and verify the self-contained QA delivery archive with SHA256 records."""
import csv, hashlib, json, subprocess, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
PACKAGE = ROOT / 'docs/edu-connect-handoff-2026-10-03'
TARGET = ROOT / 'EDU-CONNECT-QA-2026-10-03.zip'
def digest(path):
    with path.open('rb') as f: return hashlib.file_digest(f,'sha256').hexdigest()

gates = {
 'IMPLEMENTATION-CHECKLIST.csv': ('status',66,{'VERIFIED_FIXED'}),
 'RENDER-COVERAGE-416.csv': ('after_status',416,{'PASS'}),
 'PRACTICE-STATE-CHECKLIST.csv': ('open_and_long_text',184,{'PASS'}),
 'COPY-REVIEW-CHECKLIST.csv': ('status',79,{'EDITED_VERIFIED','PRESERVED_VERIFIED','DUPLICATE_VERIFIED'}),
 'PRESERVATION-CHECKLIST.csv': ('status',24,{'PASS'}),
 'QA-CHECKLIST.csv': ('status',51,{'PASS'}),
}
for name,(field,count,allowed) in gates.items():
    with (PACKAGE/'checklists'/name).open(encoding='utf-8-sig',newline='') as f:rows=list(csv.DictReader(f))
    assert len(rows)==count and all(r[field] in allowed for r in rows),name
    if name=='RENDER-COVERAGE-416.csv':assert all(r['full_body_review']=='PASS' for r in rows)
    if name=='PRACTICE-STATE-CHECKLIST.csv':
        fields=['wrong_selection','change_answer','correct_selection','unanswered_submit','submit_score_explanation','post_submit_lock','retry_reset','solution_toggle','expiry_if_available','storage_failure_if_supported']
        assert all(r[k]=='PASS' or r[k].startswith('N/A_') for r in rows for k in fields)
assert 'Trạng thái: FULL_COMPLETE' in (PACKAGE/'COMPLETION-REPORT.txt').read_text(encoding='utf-8')

source_names=[n for n in subprocess.check_output(['git','ls-files'],cwd=ROOT,text=True,encoding='utf-8').splitlines()
              if '/' not in n or n.startswith('docs/practice-review/')]
files=set(ROOT/n for n in source_names)
files.update(f for f in (ROOT/'tests').rglob('*') if f.is_file() and f.suffix in {'.py','.cjs','.js'} and '__pycache__' not in f.parts and '.python' not in f.parts)
files.update(f for f in PACKAGE.rglob('*') if f.is_file() and f.name not in {'QA-MANIFEST.json','QA-ARCHIVE-VALIDATION.json'})
files=sorted(files,key=lambda f:f.relative_to(ROOT).as_posix())
manifest={'purpose':'Final EDU CONNECT implementation and actual QA evidence; historical captures retained and acceptance ledger identifies final evidence.',
          'source_commit':(PACKAGE/'implementation/source-commit.txt').read_text(encoding='utf-8').strip(),
          'gates':{n:{'count':v[1],'status':'PASS'} for n,v in gates.items()},
          'files':[{'path':f.relative_to(ROOT).as_posix(),'bytes':f.stat().st_size,'sha256':digest(f)} for f in files]}
manifest_file=PACKAGE/'QA-MANIFEST.json'
manifest_file.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
files.append(manifest_file)
with zipfile.ZipFile(TARGET,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=4) as archive:
    for f in files:archive.write(f,f.relative_to(ROOT).as_posix())
print('Archive built; verifying every member against SHA256...',flush=True)
with zipfile.ZipFile(TARGET) as archive:
    assert len(archive.namelist())==len(files) and len(set(archive.namelist()))==len(files)
    for record in manifest['files']:
        assert hashlib.sha256(archive.read(record['path'])).hexdigest()==record['sha256'],record['path']
    assert hashlib.sha256(archive.read(manifest_file.relative_to(ROOT).as_posix())).hexdigest()==digest(manifest_file)
validation={'status':'PASS','archive':TARGET.name,'members':len(files),'bytes':TARGET.stat().st_size,
            'sha256':digest(TARGET),'all_member_hashes_verified':True,'mandatory_gates':'PASS'}
(PACKAGE/'QA-ARCHIVE-VALIDATION.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(validation,ensure_ascii=False),flush=True)
