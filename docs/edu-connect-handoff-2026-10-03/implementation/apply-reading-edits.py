"""One-time, exact presentation substitutions. This is an authoring record, not a test."""
from pathlib import Path
import json, re, subprocess
ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
JOURNAL = HERE / 'edit-journal.json'
if JOURNAL.exists(): raise SystemExit('Already applied. Use a new exact edit record for follow-up changes; do not rerun authoring.')
records = []
sources = {}
missing = []
def edit(file, before, after, issue, reason='Learner-facing copy; preserve facts and qualifiers', count=None):
    source = sources.setdefault(file,(ROOT/file).read_text('utf-8'))
    occurrences = source.count(before)
    if not occurrences:
        if after not in source: missing.append((issue,file,before))
        return
    if count is not None and occurrences != count: raise AssertionError((file,before,occurrences,count))
    sources[file] = source.replace(before,after)
    records.append(dict(file=file,before=before,after=after,count=occurrences,issue=issue,reason=reason))
def pairs(file, issue, values):
    for before,after in values: edit(file,before,after,issue)

theory = [r['destination'].lstrip('/') for r in json.loads((ROOT/'firebase.json').read_text())['hosting']['rewrites']]
practice = ['NguyenLyKeToan-LuyenDe.html','TCCN-LuyenDe.html','NhapMonLuatHoc-LuyenDe.html','KTQT-LuyenDe.html','LTMQT-LuyenDe.html','NLTTTC-LuyenDe.html']
for file in theory + practice + ['index.html']:
    edit(file,'</head>','<link rel="stylesheet" href="/reading.css">\n<script defer src="/reading.js"></script>\n</head>','G01-G09/X03/H01','Load presentation layer after local styles',1)
source = sources['index.html']
body = re.search(r'<body[^>]*>',source)[0]
newbody = body.replace('class="','class="edu-home-page ',1) if 'class="' in body else body.replace('>',' class="edu-home-page">')
edit('index.html',body,newbody,'H01','Scope homepage reading styles',1)

pairs('KinhTeChinhTriMacLeNin.html','K01',[
 ('$W$','W'),("$m'$",'m′'),(r'$\to$','→'),(r'$L_{pt} = n \times L_{gd}$','L<sub>pt</sub> = n × L<sub>gd</sub>'),
 ('$H - T - H$','H - T - H'),("$T - H - T'$",'T - H - T′'),("$T' = T + m$",'T′ = T + m'),
 ('$m$','m'),('$c$','c'),('$v$','v'),('$V$','V'),(r'$\rightarrow$','→')])

for file in practice[2:]:
    edit(file,'if (text !== undefined) element.textContent = safeText(text);',"if (text !== undefined) element.textContent = typeof text === 'number' && Number.isFinite(text) ? String(text) : safeText(text);",'X01','Convert finite numbers only at display boundary; strict data normalization unchanged',1)
    edit(file,"const quizQ = exerciseSets.filter(s => s.mode === 'mcq').reduce((sum,s) => sum + s.questions.length, 0);","const quizQ = new Set(exerciseSets.filter(s => s.mode === 'mcq').flatMap(s => s.questions.map(q => q.id))).size;",'X02','Count unique IDs across overlapping sets',1)
    edit(file,"[quizQ, 'câu trắc nghiệm']","[quizQ, 'câu trắc nghiệm riêng']",'X02','Make count scope explicit',1)
    edit(file,"set.duration, 'Gợi ý',", "set.duration, 'Thời gian gợi ý',",'X02','These pilots have suggested duration, no countdown',1)

pairs('KINH_TE_QUOC_TE.html','Q02',[
 ('<div class="eyebrow">Exact cardinality</div><h3>3 tariff types</h3>','<div class="eyebrow">3 loại thuế quan</div><h3>3 tariff types</h3>'),
 ('<div class="eyebrow">Exact cardinality</div><h3>6 primary functions</h3>','<div class="eyebrow">6 chức năng</div><h3>6 primary functions</h3>'),
 ('exact p.31 symbolic layout not safely recovered','Ký hiệu công thức ở phần này chưa đủ rõ; ôn quy tắc so sánh qua các ví dụ trong Chương 1.'),
 ('chỉ xem: exact p.31 notation is chưa đủ dữ liệu. Use semantic rule + verified examples instead.','Phần ký hiệu chưa đủ rõ để trình bày đầy đủ. Hãy dùng quy tắc bằng lời và các ví dụ trong Chương 1 để ôn tập.'),
 ('Reveal từng bước: Given → Method → Kết quả → Concept','Xem từng bước: Dữ kiện → Cách làm → Kết quả → Khái niệm'),
 ('H-O gains from trade — mối quan hệ minh họa schematic','Lợi ích thương mại theo H-O — sơ đồ minh họa')])
pairs('KE_TOAN_TAI_CHINH.html','F02',[
 ('Structured Các bảng dữ liệu · Chapter 2','Bảng dữ liệu thực hành · Chương 2'),('>Snapshot<','>Tình huống<'),
 ('Show structured transaction manifest (33 events; not verbatim reproduction)','Xem 33 nghiệp vụ trong bài tập'),
 ('Statement-presentation Bảng dữ liệu · Chapter 3','Bảng thực hành trình bày báo cáo · Chương 3'),
 ('Other-income Câu hỏi tự luyện data (structured, not verbatim)','Bài tự luyện về thu nhập khác'),
 ('Other-expense Câu hỏi tự luyện data (structured, not verbatim)','Bài tự luyện về chi phí khác'),
 ('Structured financial-statement Các bảng dữ liệu','Bảng dữ liệu báo cáo tài chính'),
 ('<span class="mini-badge badge-emerald">VERIFIED</span>','<span class="mini-badge badge-emerald">Công thức</span>'),
 ('Chapter 3 title / coverage','Phạm vi nghiệp vụ Chương 3'),
 ('Transaction workflows remain perpetual; periodic is named only.','Các ví dụ nghiệp vụ dùng phương pháp kê khai thường xuyên; phương pháp kiểm kê định kỳ được giới thiệu ở mức tổng quan.'),
 ('Trading Security Cost vs Fee Splitter','Tách giá mua và phí giao dịch chứng khoán'),('Production Cost Flow Mapper','Xem luồng hạch toán chi phí sản xuất'),('Equity SFP Preview','Xem cách trình bày vốn chủ sở hữu')])
pairs('NGUYEN_LY_KE_TOAN.html','A03',[
 ('Giới hạn tái dựng: Bố cục Company A/B chưa đủ rõ để ghép chắc chắn từng cột; phần này tập trung vào khái niệm và công thức net cash flow.','Lưu ý về ví dụ Company A/B: chưa đủ thông tin để xác định từng cột. Phần này ôn khái niệm và công thức dòng tiền thuần.'),
 ('Giới hạn dữ liệu: tiêu chí giá trị TSCĐ theo quy định hiện hành được nhắc nhưng không có ngưỡng số; Nội dung chưa cung cấp threshold.','Phần này chưa nêu ngưỡng giá trị để phân loại TSCĐ. Không suy ra ngưỡng từ các ví dụ.'),
 ('<strong>Code depth:</strong> Cấu trúc mã được giải thích đến chữ số thứ 4.','<strong>Phạm vi giải thích mã tài khoản:</strong> đến chữ số thứ 4.')])
pairs('VAN_HOA_VA_DAO_DUC_TRONG_KINH_DOANH_QUOC_TE.html','V04',[
 ('So sánh framing, sample và cardinality theo đúng dữ liệu.','So sánh góc nhìn, mẫu nghiên cứu và số chiều văn hóa của ba mô hình.'),
 ('Sáu detailed dimensions + low/high cues + exact country-score viewer.','Khám phá sáu chiều văn hóa, đặc điểm ở hai mức thấp/cao và điểm số theo quốc gia.'),
 ('<strong>Lưu ý khi đọc sơ đồ:</strong> một số world maps, country scatterplots, bảng Ease of Doing Business 190 nền kinh tế và bảng best regulatory performance có microtext/điểm màu không đủ dữ liệu để tái tạo chính xác. Trang chỉ giữ axes/legend/ý nghĩa hoặc dữ liệu đọc được; không nhập dữ liệu ngoài để “lấp chỗ trống”.','<strong>Lưu ý khi đọc sơ đồ:</strong> Một số bản đồ, đồ thị quốc gia và bảng xếp hạng chưa đủ chi tiết để đọc điểm hoặc số liệu chính xác. Hãy ôn trục, chú giải, ý nghĩa và các giá trị có sẵn; không suy ra phần còn thiếu.'),
 ('2×2 matrix + exact four-type summary.','Ma trận 2×2 và bảng tóm tắt bốn loại văn hóa tổ chức.'),
 ('Benefits/problems are conditional; six guidelines remain a checklist, not a causal process.','Lợi ích và hạn chế phụ thuộc bối cảnh. Sáu hướng dẫn dưới đây là các điểm cần cân nhắc.')])
pairs('TAM_LY_UNG_DUNG.html','D04',[
 ('School visuals — bám sát nội dung bài recreation','Sơ đồ minh họa các trường phái tâm lý học'),
 ('Không có separate Ví dụ.','Phần này giới thiệu phương pháp; chưa có ví dụ riêng.'),
 ('Câu hỏi uses 100 candles with K=0.08. Any number shown here is calculator output from the verified formula, not a worked solution.','Ví dụ dùng 100 cây nến và K = 0,08. Máy tính áp dụng ΔI = K × I; kết quả hiển thị không thay thế phần trình bày lời giải.'),
 ('the blank practice file heading contains “ANSWER KEY” although response blanks are empty; S6 is the separate filled answer key. This is a document-label inconsistency, not an academic-content conflict.','Hãy phân loại tình huống theo hệ quả và tác động tới hành vi.'),
 ('Bộ thẻ ôn tập bao quát toàn diện các kiến thức trọng tâm của các chương lý thuyết và bài tập thực hành.','Ôn các thẻ đang có của Chương 1–4 và phần điều kiện hóa thao tác; dùng bộ lọc để chọn nội dung.'),
 ('Ambiguous recognition visual — unscored','Hình ảnh đa nghĩa — tự quan sát, không chấm điểm')])
pairs('TAI_CHINH_CA_NHAN.html','T04',[
 ('Exact Balance-Sheet Examples','Ví dụ bảng cân đối cá nhân'),('Exact Cash-Flow Examples','Ví dụ báo cáo dòng tiền'),
 ('Các factor labels cụ thể không được đóng gói thành dữ liệu text đáng tin cậy, nên trang chỉ giữ quan hệ inflow/outflow thay vì tự điền tên yếu tố.','Phần này thể hiện quan hệ dòng tiền vào và dòng tiền ra; chưa đủ thông tin để nêu từng yếu tố.'),
 ('Ý chính: Quan hệ học thuật: visual compares two compounding paths to illustrate timing effects.','Sơ đồ so sánh hai quá trình tích lũy để minh họa tác động của thời điểm đóng góp.'),
 ('Detailed rows/cells from are not extractable; no plan features or values are invented.','Chưa đủ chi tiết từng phương án bảo hiểm để so sánh quyền lợi và chi phí.'),
 ('Chọn đúng 5 steps from. This is not the ambiguous claims process.','Sắp xếp năm bước của quy trình quản lý rủi ro.'),
 ('Apply Công thức exactly. Coverage factor restricted to 0.80 or 1.00.','Áp dụng công thức bên trên. Chọn hệ số bảo hiểm 0,80 hoặc 1,00 theo điều kiện của bài.'),
 ('Unverified Bài tập minh họa','Bài tự luyện'),('S8 Credit-Card Case Workspace','Thực hành tình huống thẻ tín dụng'),
 ('Dùng dữ kiện của tình huống để ghi cách làm và kết quả. Bài tập này <strong>không auto-solve</strong> và không gắn “verified answer” cho kết quả người học.','Bạn tự ghi cách làm và kết quả; hoạt động này chưa chấm đáp án.'),
 ('10 principles: exact cardinality?','Học phần nêu bao nhiêu nguyên tắc tài chính cá nhân?'),('Planning process: exact cardinality?','Quy trình lập kế hoạch tài chính cá nhân có bao nhiêu bước?'),
 ('bảng thực hành dimension','chiều phân tích trong bảng thực hành'),('outcome label','nhãn kết quả')])
pairs('LUAT_THUONG_MAI_QUOC_TE.html','L03',[
 ('Enterprise A / VAT — organizer, không auto-kết luận','Tự phân tích tình huống Enterprise A về VAT'),('Provisional nội dung giới hạn conclusion?','Kết luận sơ bộ và căn cứ?'),
 ('with unresolved article reference','Chưa xác định số điều khoản trong tài liệu đang dùng.'),('Số điều khoản cần được làm rõ','Chưa xác định số điều khoản.'),
 ('Exact tax data','Dữ liệu thuế trong ví dụ'),('Tariff quota — exact example','Ví dụ hạn ngạch thuế quan'),('Exact institution figures','Cơ cấu và nhiệm kỳ trong mô hình được học'),
 ('Comparison — chỉ dùng dimensions trong course','So sánh theo các tiêu chí trong học phần'),('Pros listed — ‘CONS?’ remains unanswered','Ưu điểm và câu hỏi tự luyện về hạn chế')])
pairs('NGUYEN_LY_THI_TRUONG_TAI_CHINH.html','B05',[
 ('Exact direction table','Bảng chiều tác động tới cầu tài sản'),('Use exact 8-dimension table in Ch.2.','Xem bảng so sánh tám tiêu chí ở Chương 2.'),
 ('Global compact deck','Thẻ ghi nhớ toàn môn'),('mục tiêu được ghi là: “Maximing shareholder value”','mục tiêu: “Maximizing shareholder value”')])
pairs('SANG_TAO_KHOI_NGHIEP.html','S05',[
 ('FPT case — questions only','Tự thảo luận tình huống FPT'),('Câu hỏi set','Câu hỏi định hướng'),('Case 2 / 3 BMC Workspace','Thực hành BMC cho hai tình huống'),('27 Framework Library','27 khung kiến thức để ôn tập'),
 ('Visual dùng nhãn Motivation / Creative Thinking Skills; prose của course dùng Task motivation / Creative thinking.','Trong sơ đồ, hai thành phần được ghi là Motivation và Creative Thinking Skills; phần giải thích dùng tên Task motivation và Creative thinking.'),
 ('Thứ tự 1–6 phải được giữ nguyên vì đây là cấu trúc của mô hình.','Ôn theo thứ tự sáu cấp độ để theo dõi cách mô hình phát triển từ nhớ kiến thức đến tạo ra cái mới.'),
 ('Không trộn visual này với 4 opportunity characteristics của Ch.6.','Đây là bốn đặc điểm được trình bày ở Chương 7; hãy đối chiếu với mô hình đặc điểm cơ hội ở Chương 6.'),
 ('Bằng chứng theo cách bạn đang xây draft','Ghi bằng chứng hỗ trợ lập luận của bạn'),('Chọn một trong 5 source topics:','Chọn một trong năm chủ đề:'),
 ('The diagram links four broad inputs to the','Sơ đồ liên kết bốn nhóm yếu tố với')])
pairs('PHAT_TRIEN_BEN_VUNG.html','P04',[
 ('Cardinality checklist','Số lượng và nhóm kiến thức cần nhớ'),('Ghi nhớ Cấu trúc review 3 phần của implementation.','Ghi nhớ ba phần: thành tựu, hạn chế và giải pháp trong thực hiện SDGs tại Việt Nam.'),
 ('State vs IFI — descriptive only','So sánh vai trò Nhà nước và các tổ chức tài chính quốc tế'),('17-goal visual','Sơ đồ 17 mục tiêu')])

pairs('index.html','H02-H04',[
 ('Trung Tâm Luyện Đề Thực Chiến','Luyện tập theo môn'),
 ('Luyện định khoản nợ/có, lập bảng CĐKT, báo cáo P&amp;L và tập hợp chi phí giá thành sản phẩm.','Trắc nghiệm theo chương và bài tự luận kế toán có lời giải để tự đối chiếu.'),
 ('Trắc Nghiệm Luật Học','Trắc nghiệm Nhập môn Luật học'),
 ('Bộ đề thi thử phân tích cấu trúc quy phạm pháp luật, xác định loại lỗi vi phạm và hệ thống văn bản pháp luật.','Luyện thử 20 câu trắc nghiệm nền tảng, gồm 3 bộ theo chương và một đề tổng hợp; chấm điểm và xem giải thích.'),
 ('<span class="text-sm font-bold text-stone-500" aria-disabled="true">Sắp ra mắt</span>','<a href="/NhapMonLuatHoc-LuyenDe" class="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:underline">Vào luyện tập &rarr;</a>')])
newcards = ''
for route,name,count,icon in [('KTQT-LuyenDe','Kinh tế quốc tế',4,'🌐'),('LTMQT-LuyenDe','Luật thương mại quốc tế',5,'⚖️'),('NLTTTC-LuyenDe','Nguyên lý thị trường tài chính',6,'🏦')]:
    newcards += f'''<div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col">
<div class="text-2xl mb-4">{icon}</div><h3 class="font-extrabold text-lg text-stone-800 mb-1">{name}</h3>
<p class="text-sm text-stone-600 leading-relaxed mb-4">Luyện thử 20 câu trắc nghiệm riêng, gồm {count} bộ theo chương và một đề tổng hợp; có chấm điểm, giải thích và thời gian gợi ý.</p>
<a href="/{route}" class="inline-flex items-center text-sm font-bold text-blue-700 hover:underline mt-auto">Vào luyện tập &rarr;</a></div>\n'''
edit('index.html','    </div>\n</div>\n\n   <!-- Footer -->',newcards+'    </div>\n</div>\n\n   <!-- Footer -->','H03','Add the three existing pilot routes without changing course cards',1)

for file,source in sources.items(): (ROOT/file).write_text(source,'utf-8',newline='\n')
HERE.mkdir(parents=True,exist_ok=True)
JOURNAL.write_text(json.dumps(records,ensure_ascii=False,indent=2),'utf-8')
(HERE/'unmatched-copy.json').write_text(json.dumps(missing,ensure_ascii=False,indent=2),'utf-8')
print(f'{len(records)} exact edit records; {len(sources)} files; {len(missing)} phrases need context review')
for row in missing: print(ascii(row))
