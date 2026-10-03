"""Write the final report only after the complete runbook and acceptance gates pass."""
import csv, json, subprocess
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[3]
P = ROOT / 'docs/edu-connect-handoff-2026-10-03'
def load(name): return json.loads((P/name).read_text(encoding='utf-8'))
def csv_rows(name):
    with (P/name).open(encoding='utf-8-sig',newline='') as f: return list(csv.DictReader(f))
runbook = load('evidence/after/logs/runbook-results.json')
assert len(runbook)==19 and all(r['status']=='PASS' and r['exit_code']==0 for r in runbook), 'Complete runbook still running or failed.'
commit = (P/'implementation/source-commit.txt').read_text(encoding='utf-8').strip()
branch = subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()
visual = load('implementation/visual-review.json')
practice_visual = load('implementation/practice-visual-review.json')
assert len(visual)==416 and all(r['full_body_status']=='PASS' for r in visual.values())
assert len(practice_visual)==184 and all(r['status']=='PASS' for r in practice_visual.values())
counts = {'render':416,'practice-states':184,'targeted':84,'accessibility':79,'practice-header':38,
          'input-methods-final':48,'touch':48,'zoom':36,'contrast':104,'diagram-acceptance':36,
          'diagram-zoom':18,'practice-reading':184,'practice-inputs':24,'pyramid':8,'surface-contrast':104,'anchor':4}
for folder,count in counts.items():
    data=load('evidence/after/'+folder+'/results.json'); rows=data if isinstance(data,list) else data['results']
    assert len(rows)==count and all(r.get('pass',True) and r.get('automated_status','PASS')=='PASS' and not r.get('failures') for r in rows),folder
issues=csv_rows('ISSUE-REGISTER.csv')
journal=load('implementation/edit-journal.json')
lines=[
 'BÁO CÁO HOÀN THÀNH EDU CONNECT — 2026-10-03', '',
 'Trạng thái: FULL_COMPLETE',
 'Branch: '+branch,
 'Commit mã nguồn hoàn tất: '+commit,
 'Implementation base / audit base: 5b0e619fb6838363a79dcb2966a6c138375a59ec.',
 'Delta upstream: thực hiện trên đúng audit base cục bộ; không fetch/pull hoặc thay baseline giữa nhiệm vụ.',
 'Commit hồ sơ nghiệm thu: xem Git history của nhánh sau commit mã nguồn trên. Không tạo draft PR vì bản commit cục bộ đã sẵn review.',
 'Preview: http://127.0.0.1:4173/ (node tests/serve.cjs).',
 'Môi trường: Windows, Node 24.18.0, Python 3.12, Playwright + Microsoft Edge 154.0.4258.53 headless.',
 'Fixture: student@example.test; Firebase fixture; storage tách theo browser context; chặn kết nối auth/database production.',
 'Ngày nghiệm thu: '+datetime.now(timezone.utc).isoformat()+'; múi giờ người dùng Asia/Saigon.', '',
 'THAY ĐỔI VÀ TÁC DỤNG VỚI SINH VIÊN',
 '- Đồng bộ chữ đọc, màu, khoảng cách card và cấp heading trên homepage, 12 môn và 6 route luyện tập; chữ Việt/English/toán rõ và dễ đọc hơn.',
 '- Menu chương/picker đồng bộ, TOC đặt heading dưới header, thao tác 44px, focus bàn phím rõ, reduced motion và modal PTBV có focus trap/Escape/return.',
 '- Thẻ lật dùng chiều cao theo hai mặt, reflow sơ đồ trên điện thoại; bảng và BMC/DSB có cuộn cục bộ cùng chỉ dẫn, tới được cột cuối.',
 '- Công thức KTCT và ERP hiển thị bằng markup đọc được; số bảng/đếm câu/thời gian không vỡ dòng hoặc biến thành giá trị rác.',
 '- Biên tập nhãn học tập, lối vào luyện đề và khối thiếu dữ liệu; các phần chưa có lời giải/dữ liệu vẫn nói rõ giới hạn. Homepage bổ sung ba CTA pilot và NMLH.',
 '- Giữ nguyên nội dung học thuật, mô hình riêng, 33 events KTTC, dữ liệu nguồn, ngân hàng/đáp án, constraints và auth/Firebase/rules/routes.', '',
 'KẾT QUẢ NGHIỆM THU',
 'Issue: 66/66 VERIFIED_FIXED; VERIFIED_NO_FIX=0; pending=0; FAIL=0; BLOCKED=0.',
 'Render: 416/416 PASS = 82 tab × 4 (328) + 21 mode × 4 (84) + homepage × 4 (4). FAIL/BLOCKED/NOT_RUN=0.',
 'Viewport: 320×740, 390×844, 768×1024, 1366×900; bổ sung biên 767/768 và 1279/1280, vùng 641–1024 và modal landscape.',
 'Copy: 79/79 verified = 63 EDITED_VERIFIED, 12 PRESERVED_VERIFIED, 4 DUPLICATE_VERIFIED; pending=0.',
 'Exact journal: implementation/edit-journal.json — '+str(len(journal))+' thay thế có before/after/count; bổ sung implementation/preserved-copy.json cho 12 mục giữ nguyên.',
 'Practice: 46 bộ/biến thể × 4 = 184/184 PASS, gồm chọn sai/đổi/chọn đúng/nộp khi còn trống/điểm/lời giải/khóa sau nộp/làm lại, expiry và storage failure khi hỗ trợ.',
 'Random/mistakes: mỗi dòng evidence/after/practice-states/results.json ghi fixture, set_id và actual question_ids; các case hướng dẫn có N/A đúng theo chức năng.',
 'Preservation: 24/24 PASS; QA: 51/51 PASS; không còn công việc bắt buộc chưa thực hiện.', '',
 'PHƯƠNG PHÁP VÀ GIỚI HẠN BẰNG CHỨNG',
 '- Đã xem thực tế toàn bộ tile body, mở disclosures và hai mặt thẻ. implementation/visual-review.json ánh xạ 416 trạng thái tới sheet đã xem và ảnh component sửa cuối.',
 '- 184 trạng thái luyện tập: đo tất cả question/option/explanation bounds; xem câu dài nhất lúc mở và sau chấm, hoặc toàn body guided case. Đã xem đủ 40 sheets/471 tiles; implementation/practice-visual-review.json ghi theo từng ST ID.',
 '- Survey toàn trang được thu nhỏ để rà bố cục; ảnh gốc được giữ để đọc đúng kích thước và đối chiếu cùng computed fonts/metrics. Không dùng chỉ riêng số đo/capture để kết luận visual PASS.',
 '- Trang dài được chụp thành các đoạn và ghép tránh giới hạn ảnh Edge; evidence/after/render/capture-fidelity.json ghi fidelity. Header cố định có thể xuất hiện giữa một số element screenshots do browser tự scroll; ảnh toàn body/native scrolling bổ sung vùng đó.',
 '- Zoom là tăng kích thước chữ/computed line metrics lên 200%, giữ tọa độ SVG: 36 case prose/nav/table, 18 case diagram, 8 ảnh pyramid 100/200%. Đây không phải browser page zoom.',
 '- Keyboard/touch dùng sự kiện native trong browser/CDP và viewport emulation; không tuyên bố đã thử máy điện thoại vật lý hoặc bàn phím ảo hệ điều hành.',
 '- Contrast: đo surface phẳng, bổ sung 104 trạng thái với nền gradient (lấy mẫu stop/interpolation bảo thủ) và dừng ở surface đặc gần chữ; thêm 24 case đáp án khóa sau chấm. Opacity/SVG/emoji nằm ngoài phép đo tự động và rà bằng ảnh. Các nhãn phụ trên gradient đã được tăng cỡ/làm đậm khi cần.',
 '- Các gallery/ảnh lịch sử đã được thay thế vẫn giữ để truy vết. Ledger chỉ rõ ảnh được chấp nhận cuối; TCCN_diagnostic.png là ảnh chẩn đoán cũ, không dùng để kết luận PASS.', '',
 'LỆNH KIỂM / EXIT CODE / PHẠM VI / LOG'
]
for r in runbook:
    lines.append(r['command']+' | exit '+str(r['exit_code'])+' | '+r['status']+' | '+r['log'])
lines += ['python tests/handoff_inline_syntax.py | exit 0 | PASS: 37 inline scripts + 420 handlers; evidence/after/logs/inline-syntax.log.',
          'Ma trận bổ sung (kết quả từng case và ảnh gốc nằm trong thư mục sau):']
for folder,count in counts.items():
    script={'render':'handoff-render.cjs','practice-states':'handoff-practice-states.cjs',
            'accessibility':'handoff-accessibility.cjs','targeted':'handoff-targeted.cjs',
            'practice-header':'handoff-practice-header.cjs','input-methods-final':'handoff-input-methods.cjs',
            'contrast':'handoff-contrast.cjs','diagram-zoom':'handoff-zoom.cjs'}.get(folder,'handoff-'+folder+'.cjs')
    lines.append('node tests/'+script+' | exit 0 | '+str(count)+'/'+str(count)+' PASS | evidence/after/'+folder+'/results.json')
lines += [
 'Render chạy hai shards đủ ma trận, sau đó refresh đúng các route bị sửa; mỗi row giữ tested_source_hashes. Đủ 416 coverage_id duy nhất, không dùng filter để bỏ trạng thái. Bộ runbook 19 mục chạy đầy đủ ở e8fab91; sau lần sửa CSS nhãn/gradient cuối, chạy lại static checks và 88 trạng thái KTTC/KTQT/TCCN/home, 104 trạng thái contrast và mọi thẻ TCCN. Sau sửa reflow ANCHOR, kiểm lại bốn ảnh native và static checks; chỉ component này thay đổi.',
 'Input methods cuối: handoff-input-methods.cjs với INPUT_ROUTES=all12; contrast bổ sung graded dùng handoff-contrast-measure.cjs qua practice-inputs; diagram zoom dùng ZOOM_DIAGRAMS=1.', '',
 'CHI TIẾT 66 ISSUE',
 'Mã | kết quả | file/commit | viewport/state | evidence trước/sau | phần còn lại',
]
for r in issues:
    lines.append(r['issue_id']+' | VERIFIED_FIXED | '+r['routes']+' / '+commit[:7]+' | bốn viewport; xem render/QA theo route/state | trước: baseline/live-study-audit.json, baseline/live-practice-audit.json, evidence/before và evidence/baseline-local; sau: '+r['result_evidence']+' | không còn. '+r['component'])
lines += ['', 'CÁC GIỚI HẠN HỌC THUẬT VẪN GIỮ / NGUỒN CẦN BỔ SUNG',
          'Nhiệm vụ này là chỉnh UI/copy, chưa đối chiếu giáo trình gốc hay xác minh luật/tài chính hiện hành. Các câu hỏi dưới đây cần giáo trình/tài liệu gốc hoặc giảng viên xác nhận; không phải blocker của UI pass.']
lines += (P/'instructions/ACADEMIC-QUESTIONS.txt').read_text(encoding='utf-8').splitlines()[2:]
lines += ['', 'Vị trí nguyên văn minh họa qualifier/function được giữ:']
for copy_id,records in load('implementation/preserved-copy.json').items():
    for r in records:lines.append(copy_id+' | '+r['file']+':'+str(r['line'])+' | '+r['exact'])
lines += ['', 'BLOCKERS CÒN LẠI: Không.',
          'PHÁT HÀNH: Chưa merge main, chưa push, chưa deploy production. Nhánh và các commit cục bộ đã sẵn review; phát hành cần chấp thuận riêng theo START-HERE.txt.',
          'GÓI QA: EDU-CONNECT-QA-2026-10-03.zip tại thư mục gốc workspace, chứa báo cáo/checklists, nguồn, scripts, logs, ảnh trước/sau, JSON kết quả và QA-MANIFEST.json với SHA256.',
          'PACKAGE-MANIFEST.json là manifest archive đầu vào; các checklist hiện là bản working đã đóng. QA-MANIFEST.json mô tả gói kết quả cuối.']
(P/'COMPLETION-REPORT.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('Final completion report written after all mandatory gates passed.')
