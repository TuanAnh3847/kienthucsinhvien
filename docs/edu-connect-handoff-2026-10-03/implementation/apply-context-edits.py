"""Follow-up authoring after reading actual markup. Not a validation command."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
JOURNAL=HERE/'edit-journal.json'
records=json.loads(JOURNAL.read_text('utf-8'))
if any(r['issue']=='T01-context' for r in records): raise SystemExit('Already applied; do not rerun authoring')
sources={}
def edit(file,before,after,issue,reason='Exact contextual learner-facing substitution'):
    source=sources.setdefault(file,(ROOT/file).read_text('utf-8'))
    count=source.count(before)
    assert count,(file,before[:100])
    sources[file]=source.replace(before,after)
    records.append(dict(file=file,before=before,after=after,count=count,issue=issue,reason=reason))
def div_block(source,start):
    depth=0
    for match in re.finditer(r'</?div\b[^>]*>',source[start:]):
        depth+=-1 if match[0].startswith('</') else 1
        if depth==0: return source[start:start+match.end()]
    raise AssertionError('Unclosed div')
edit('NGUYEN_LY_KE_TOAN.html','<strong>Giới hạn tái dựng:</strong> Bố cục Company A/B chưa đủ rõ để ghép chắc chắn từng cột; phần này tập trung vào khái niệm và công thức net cash flow.','<strong>Lưu ý về ví dụ Company A/B:</strong> chưa đủ thông tin để xác định từng cột. Phần này ôn khái niệm và công thức dòng tiền thuần.','A03')
edit('NGUYEN_LY_KE_TOAN.html','<strong>Giới hạn dữ liệu:</strong> tiêu chí giá trị TSCĐ theo quy định hiện hành được nhắc nhưng không có ngưỡng số; Nội dung chưa cung cấp threshold.','<strong>Lưu ý:</strong> Phần này chưa nêu ngưỡng giá trị để phân loại TSCĐ. Không suy ra ngưỡng từ các ví dụ.','A03')
source=(ROOT/'TAM_LY_UNG_DUNG.html').read_text('utf-8')
needle='100 candles'
start=source.index(needle); left=source.rfind('<p',0,start);right=source.index('</p>',start)+4
before=source[left:right]
edit('TAM_LY_UNG_DUNG.html',before,'<p class="hint">Ví dụ dùng 100 cây nến và K = 0,08. Máy tính áp dụng ΔI = K × I; kết quả hiển thị không thay thế phần trình bày lời giải.</p>','D04')
edit('TAI_CHINH_CA_NHAN.html','<strong>Ý chính:</strong> Quan hệ học thuật: visual compares two compounding paths to illustrate timing effects.','<strong>Minh họa định tính:</strong> Sơ đồ so sánh hai quá trình tích lũy để minh họa tác động của thời điểm đóng góp.','T04')
edit('LUAT_THUONG_MAI_QUOC_TE.html','Pros listed — “CONS?” remains unanswered','Ưu điểm và câu hỏi tự luyện về hạn chế','L03')
edit('PHAT_TRIEN_BEN_VUNG.html','Cấu trúc review 3 phần của implementation.','Ba phần: thành tựu, hạn chế và giải pháp trong thực hiện SDGs tại Việt Nam.','P04')
edit('TCCN-LuyenDe.html','<div class="text-2xl font-black">4</div><div class="text-xs text-stone-300 font-bold">bộ luyện thi</div>','<div class="text-2xl font-black">5</div><div class="text-xs text-stone-300 font-bold">bộ luyện thi</div>','X05','Match the existing five exam configurations; banks and timer unchanged')

file='TAI_CHINH_CA_NHAN.html'
source=sources[file]
for title,summary in [('Vietnamese career-field salary-range visual','Ví dụ khoảng lương theo nghề — chưa đủ số liệu'),('Career Plans for Harry Johnson','Kế hoạch nghề nghiệp của Harry Johnson — chưa đủ dữ kiện')]:
    pos=source.index(title)
    start=source.rfind('<div>',0,pos)
    before=div_block(source,start)
    after='<details class="edu-incomplete"><summary>'+summary+'</summary><p>Ví dụ này chưa đủ số liệu để thực hành. Các nhãn gốc được giữ bên dưới để đối chiếu.</p>'+before+'</details>'
    edit(file,before,after,'T01-context','Collapse incomplete source context; no salary, goals or dates invented')
    source=sources[file]
edit(file,'Vietnamese career-field salary-range visual','Khoảng lương theo nhóm nghề','T01-context')
source=sources[file]
pos=source.index('How to buy life insurance — six-position visual')
start=source.rfind('<div class="mt-4 limited-visual">',0,pos)
before=div_block(source,start)
after=before.replace('How to buy life insurance — six-position visual','Các điểm cân nhắc khi mua bảo hiểm nhân thọ')
empty='<div class="concept-card"><h4>Unordered consideration</h4><p>Exact label mapping unavailable.</p></div>'
assert after.count(empty)==6
after=after.replace(empty,'')
after=after.replace('<div class="concept-grid mt-3">','<p class="status-note">Chưa đủ thông tin để xác định thứ tự sáu vị trí.</p><div class="concept-grid mt-3">')
after=after.replace('<div class="limited-icon">6</div>','')
edit(file,before,after,'T02','Remove six empty repeated slots, preserve supplied considerations and unresolved order')

# Collapse truly empty quantitative blocks. Meaningful qualitative diagrams remain visible.
for title in ['Starting age / $1 million by age 68','Decision Making Worksheet','Bancassurance product table','Personal Property Checklist — Living Room','Basic supplemental group health insurance plans table','$100,000 policy annual-premiums table','Life-insurance odds / numbers table','Second-income worksheet','“Buy Term Insurance and Invest the Rest”']:
    source=sources[file];pos=source.index(title)
    candidates=list(re.finditer(r'<div class="[^"]*limited-visual[^"]*">',source[:pos]))
    start=candidates[-1].start();before=div_block(source,start)
    after=re.sub(r'<div class="limited-icon">[\s\S]*?</div>','',before,count=1)
    after='<details class="edu-incomplete"><summary>'+title+' — chưa đủ dữ liệu để thực hành</summary><p>Phần này chưa có đủ dữ liệu để lập bảng hoặc đọc số liệu định lượng.</p>'+after+'</details>'
    edit(file,before,after,'T03','Keep all source labels and uncertainty accessible; close incomplete quantitative illustration')
for title in ['Hierarchy of Financial Needs','Earlier contributions compound longer','Nature of cash-value life insurance','Life-cycle graph']:
    source=sources[file];pos=source.index(title)
    # Add a visible qualifier to the existing heading without modifying diagram relations.
    left=source.rfind('<h4',0,pos);right=source.index('</h4>',pos)+5
    before=source[left:right]
    edit(file,before,before+'<p class="helper">Minh họa định tính; chưa dùng để đọc giá trị định lượng.</p>','T03')

# Missing finance direction cells remain visibly unknown, never inferred.
file='NGUYEN_LY_THI_TRUONG_TAI_CHINH.html'
source=sources.setdefault(file,(ROOT/file).read_text('utf-8'))
for title in ['Bảng dịch chuyển cầu — một số ô chưa đủ dữ kiện','Bảng dịch chuyển cung — một số ô chưa đủ dữ kiện']:
    pos=source.find(title)
    if pos<0: continue
    start=source.index('<table',pos);end=source.index('</table>',start)+8
    before=source[start:end]
    after=before.replace('<td></td>','<td><span class="helper">Chưa có dữ kiện</span></td>').replace('<td> </td>','<td><span class="helper">Chưa có dữ kiện</span></td>')
    if before!=after: edit(file,before,after,'B05','Label explicitly empty direction cells without filling arrows or answers')
    source=sources[file]

for file,source in sources.items(): (ROOT/file).write_text(source,'utf-8',newline='\n')
JOURNAL.write_text(json.dumps(records,ensure_ascii=False,indent=2),'utf-8')
print(len(records),'exact edit records after contextual follow-up')
