"""One-time exact role-label edits. Never run as a test."""
from pathlib import Path
import re,json
ROOT=Path(__file__).resolve().parents[3];J=Path(__file__).with_name('edit-journal.json');records=json.loads(J.read_text('utf-8'))
if any(r['issue']=='CP061-labels' for r in records):raise SystemExit('Already applied')
labels={'See':'Ví dụ và sơ đồ','Understand':'Khái niệm','Apply':'Tự luyện','Try':'Tự luyện','Recall':'Ôn nhanh','Map':'Sơ đồ ôn tập','Compare':'So sánh','Understand + Apply':'Khái niệm và tự luyện','See + Apply':'Ví dụ và tự luyện','Understand → Apply':'Khái niệm và tự luyện'}
for file in ROOT.glob('*.html'):
 if '-LuyenDe' in file.name or file.name in ['index.html','privacy.html','admin.html','404.html']:continue
 source=file.read_text('utf-8');changes=[]
 for m in re.finditer(r'<(div|span) class="([^"]*(?:learn-kicker|section-kicker|section-label|eyebrow|kicker)[^"]*)">([^<]*)</\1>',source):
  value=m[3].strip()
  if value in labels:changes.append((m[0],m[0].replace(m[3],labels[value])))
 for m in re.finditer(r'<div class="tool-title">([^<]*(?:Splitter|Mapper|Preview)[^<]*)</div>',source):
  prefix='Tách dữ liệu: ' if 'Splitter' in m[1] else 'Đối chiếu dữ liệu: ' if 'Mapper' in m[1] else 'Xem trước: '
  changes.append((m[0],m[0].replace(m[1],prefix+m[1])))
 for before,after in dict(changes).items():
  count=source.count(before);source=source.replace(before,after)
  records.append(dict(file=file.name,before=before,after=after,count=count,issue='CP061-labels',reason='Translate interface role label only; academic English, order and tool logic preserved'))
 if changes:file.write_text(source,'utf-8',newline='\n')
J.write_text(json.dumps(records,ensure_ascii=False,indent=2),'utf-8');print(len(records),'exact records')
