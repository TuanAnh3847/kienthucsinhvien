import re
from pathlib import Path
import json

root = Path(__file__).resolve().parent.parent

def run_academic_negative_guards():
    print("Running Academic Negative Guards...")
    
    # 1. TLUD guards
    tlud = (root / 'TAM_LY_UNG_DUNG.html').read_text(encoding='utf-8')
    assert 'chuyên đề đọc thêm mở rộng' not in tlud, "TLUD still contains 'chuyên đề đọc thêm mở rộng'"
    assert 'ngoài chương trình thi' not in tlud, "TLUD still claims 'ngoài chương trình thi'"
    assert 'ngoài trọng tâm thi' not in tlud, "TLUD still claims 'ngoài trọng tâm thi'"
    assert 'Jean Piaget' in tlud or 'Piaget' in tlud, "TLUD missing Piaget"
    assert 'Erik Erikson' in tlud or 'Erikson' in tlud, "TLUD missing Erikson"
    assert 'Big Five' in tlud and 'OCEAN' in tlud, "TLUD missing Big Five OCEAN"
    assert 'Intrinsic Motivation' in tlud, "TLUD missing Intrinsic Motivation"
    assert 'Yerkes-Dodson' in tlud, "TLUD missing Yerkes-Dodson"
    print("  PASS: TLUD Academic Negative Guards")

    # 2. KTQT guards
    ktqt = (root / 'KINH_TE_QUOC_TE.html').read_text(encoding='utf-8')
    assert 'limited-box' not in ktqt, "KTQT Ch5/Ch6 still contains placeholder limited-box"
    assert 'VMPK' in ktqt, "KTQT missing VMPK model"
    assert 'VMPL' in ktqt, "KTQT missing VMPL model"
    assert 'Q_K = -5r + 80' in ktqt, "KTQT missing capital numerical exercise"
    assert 'Q_L1 = -w + 30' in ktqt, "KTQT missing labor numerical exercise"
    assert 'Trade Creation' in ktqt and 'Trade Diversion' in ktqt, "KTQT missing Customs Union theory"
    assert 'Jacob Viner' in ktqt, "KTQT missing Jacob Viner"
    assert 'b + d' in ktqt or '(b + d)' in ktqt, "KTQT missing trade creation welfare (b+d)"
    assert '(b + d) - e' in ktqt, "KTQT missing trade diversion welfare ((b+d)-e)"
    print("  PASS: KTQT Academic Negative Guards")

    # 3. TCCN guards
    tccn = (root / 'TAI_CHINH_CA_NHAN.html').read_text(encoding='utf-8')
    assert 'Exact criteria / percentages unavailable' not in tccn, "TCCN still has placeholder for credit score criteria"
    assert 'Chưa có số liệu đồ thị để so sánh định lượng' not in tccn, "TCCN still has placeholder for credit comparison"
    assert 'Payment History' in tccn and '35%' in tccn, "TCCN missing Payment History 35%"
    assert 'Amount of Debt / Owing' in tccn and '30%' in tccn, "TCCN missing Amount of Debt 30%"
    assert 'Length of Credit History' in tccn and '15%' in tccn, "TCCN missing Length of Credit History 15%"
    assert 'Thông tư 39/2016/TT-NHNN Điều 10' in tccn, "TCCN loan duration not attributed to Thông tư 39/2016/TT-NHNN Điều 10"
    assert 'FICO MODEL' not in tccn, "TCCN has forbidden FICO MODEL in main heading"
    print("  PASS: TCCN Academic Negative Guards")

    # 4. NLTTTC guards
    nltttc = (root / 'NGUYEN_LY_THI_TRUONG_TAI_CHINH.html').read_text(encoding='utf-8')
    assert 'locked-card' not in nltttc, "NLTTTC still contains locked-card placeholders"
    assert 'Chuyên đề đọc thêm mở rộng' not in nltttc, "NLTTTC still contains 'Chuyên đề đọc thêm mở rộng'"
    assert '[cần làm rõ số mũ]' not in nltttc, "NLTTTC still contains '[cần làm rõ số mũ]'"
    assert 'Tài chính bền vững (Sustainable Finance)' in nltttc, "NLTTTC missing Sustainable Finance"
    assert 'Tài chính phi tập trung (DeFi)' in nltttc, "NLTTTC missing DeFi"
    assert 'Thị trường phái sinh (Derivatives Market)' in nltttc, "NLTTTC missing Derivatives Market"
    assert 'Khủng hoảng tài chính' in nltttc, "NLTTTC missing Financial Crises"
    assert 'Dòng tiền đều đầu kỳ' in nltttc, "NLTTTC missing Annuity Due"
    assert 'Tam giác bất khả thi' in nltttc, "NLTTTC missing Impossible Trinity"
    print("  PASS: NLTTTC Academic Negative Guards")

    # 5. Public builder / meta-leakage guard across all 4 targets
    forbidden_terms = [
        'source says', 'according to our source', 'source insufficient',
        'reconstructed', 'compiler', 'missing material',
        'we inferred', 'page preserved', 'textbook supplement', 'academic supplement',
        'trace note', 'trace pack', 'author trace', 'internal trace'
    ]
    for fname, text in [('KTQT', ktqt), ('TLUD', tlud), ('TCCN', tccn), ('NLTTTC', nltttc)]:
        lower = text.lower()
        for term in forbidden_terms:
            assert term not in lower, f"{fname} leaks forbidden meta-term: '{term}'"
    print("  PASS: Zero Public Builder / Source Leakage in Academic Targets")

if __name__ == '__main__':
    run_academic_negative_guards()
