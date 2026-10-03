"""Pin exact retained wording and source locations for the twelve no-edit copy rows."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
PACKAGE = ROOT / 'docs/edu-connect-handoff-2026-10-03'
spec = {
    6: [('KINH_TE_QUOC_TE.html', 'Kết luận theo đơn vị hiện vật: Britain capital abundant; America labor abundant. Phần giá yếu tố sản xuất là câu hỏi tự luyện, chưa có lời giải mẫu.')],
    15: [('KE_TOAN_TAI_CHINH.html', 'hoạt động này chưa hỗ trợ tính tự động.'), ('KE_TOAN_TAI_CHINH.html', 'Công cụ yêu cầu nhập giá trị ghi sổ, chưa hỗ trợ tự tính bình quân di động.')],
    19: [('NGUYEN_LY_KE_TOAN.html', 'tài khoản 112 có hai cách gọi'), ('NGUYEN_LY_KE_TOAN.html', 'mô tả ghi Sep 19, General Journal ghi 18/9.')],
    25: [('VAN_HOA_VA_DAO_DUC_TRONG_KINH_DOANH_QUOC_TE.html', 'Ba giá trị được nêu cộng thành 90%; hãy dùng đúng các số liệu này và không suy ra 10% còn thiếu.')],
    31: [('TAM_LY_UNG_DUNG.html', 'Các cột chỉ thể hiện tương quan, không dùng để đọc giá trị tuyệt đối.'), ('TAM_LY_UNG_DUNG.html', 'S.F. 3493 / “…2 seconds” / 3492:')],
    43: [('TAI_CHINH_CA_NHAN.html', 'Nhận định “Less than 2.5 is a red flag” chưa chỉ rõ 2.5 ứng với tỷ số nào; không áp dụng ngưỡng này cho một tỷ số cụ thể.'), ('TAI_CHINH_CA_NHAN.html', 'Vì vậy phần này dùng để xem lại ví dụ và chưa có máy tính IRR.'), ('TAI_CHINH_CA_NHAN.html', 'Bốn hành động; bài tập không chấm cách ghép cụ thể với Step 2/3.')],
    47: [('LUAT_THUONG_MAI_QUOC_TE.html', 'Số liệu lịch sử để luyện phân tích, không phải số liệu hiện hành.')],
    55: [('SANG_TAO_KHOI_NGHIEP.html', 'Hai cặp Myth ↔ Facts về Bill Gates và Mark Zuckerberg được dùng làm tình huống thảo luận trong bài, không phải hồ sơ tiểu sử đã kiểm chứng.'), ('SANG_TAO_KHOI_NGHIEP.html', 'Không có đáp án mẫu cho các activity này.')],
    59: [('PHAT_TRIEN_BEN_VUNG.html', 'Đây là ví dụ minh họa, không đại diện cho toàn bộ chương trình phát triển bền vững của Việt Nam.'), ('PHAT_TRIEN_BEN_VUNG.html', 'coverage được nêu là >92%')],
    60: [('NhapMonLuatHoc.html', '>PREMIUM<'), ('KinhTeChinhTriMacLeNin.html', '>PREMIUM<')],
    62: [('index.html', 'Luyện theo chương, làm bài nhanh hoặc đề tổng hợp có đồng hồ; xem kết quả và giải thích sau khi làm bài.'), ('index.html', 'href="/TCCN-LuyenDe"')],
    70: [('index.html', '⏳ Sắp ra mắt...'), ('TCCN-LuyenDe.html', 'Chưa có câu sai nào được lưu')],
}
output = {}
for n, records in spec.items():
    output['CP'+str(n).zfill(3)] = []
    for filename, quote in records:
        source = (ROOT / filename).read_text(encoding='utf-8')
        assert quote in source, (filename, quote)
        output['CP'+str(n).zfill(3)].append({'file': filename, 'line': source.count('\n',0,source.index(quote))+1, 'exact': quote, 'count': source.count(quote)})
(PACKAGE/'implementation/preserved-copy.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Pinned twelve preserved copy rows; full academic qualifiers also protected by whole-source replay.')
