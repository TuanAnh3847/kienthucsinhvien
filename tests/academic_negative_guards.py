import re
from pathlib import Path
import json
from html import unescape

root = Path(__file__).resolve().parent.parent

def check_exact_recovered_values(ktqt, nltttc):
    # Lecturer Chapter 6_ST pp.17/25: independently solved percent-unit models.
    plain = unescape(re.sub(r'<[^>]+>', '', ktqt))
    for expression in ['r₁ = 2%', 'r₂ = 4%', 'r* = 3%',
                       'Q_K1 = -5(2) + 80 = 70 tỷ USD',
                       'Q_K2 = -5(4) + 80 = 60 tỷ USD',
                       'Q_K1* = -5(3) + 80 = 65 tỷ USD',
                       'Q_K2* = -5(3) + 80 = 65 tỷ USD',
                       'ΔK = 70 - 65 = 5 tỷ USD',
                       'ΔGNP₁ = ½ × 5 × (3% - 2%) = 25 triệu USD',
                       'ΔGNP₂ = ½ × 5 × (4% - 3%) = 25 triệu USD',
                       '25 + 25 = 50 triệu USD',
                       '½ × 2 × (12 - 10) = 2.000 USD/giờ']:
        assert expression in plain, f'KTQT exact source-derived result changed: {expression}'
    # Check every rendered exponent, not a formula prefix elsewhere on the page.
    for prefix, exponent in [('FV = P × (1 + i/n)', 'n·t'), ('EAR = (1 + i/n)', 'n')]:
        occurrences = re.findall(re.escape(prefix) + r'<sup>(.*?)</sup>', nltttc)
        assert len(occurrences) == 3 and all(x == exponent for x in occurrences), f'Wrong/missing exponent: {prefix}'
    assert 'FV = PMT × [((1 + r)ⁿ - 1) / r] × (1 + r)' in nltttc, 'Annuity-due multiplier changed'
    forms = re.search(r'4 Hình thức FDI.*?</article>', ktqt, re.S)
    assert forms and re.findall(r'<strong>(\d+)\.', forms[0]) == ['1', '2', '3', '4'], 'FDI forms count changed'
    for heading, count in [('5 Mục đích chính của FDI', 5), ('6 Lợi ích cốt lõi', 6), ('6 Rủi ro &amp; Hạn chế', 6)]:
        block = re.search(re.escape(heading) + r'.*?</h[34]>\s*<[uo]l[^>]*>(.*?)</[uo]l>', ktqt, re.S)
        assert block and len(re.findall(r'<li\b', block[1])) == count, f'FDI count mismatch: {heading}'

def exact_guard_self_test(ktqt, nltttc):
    mutations = [(ktqt.replace('70 tỷ USD', '71 tỷ USD', 1), nltttc),
                 (ktqt.replace('25 triệu USD', '26 triệu USD', 1), nltttc),
                 (ktqt, nltttc.replace('<sup>n·t</sup>', '<sup>n+t</sup>', 1)),
                 (ktqt, nltttc.replace('<sup>n</sup>', '<sup>t</sup>', 1)),
                 (ktqt, nltttc.replace('/ r] × (1 + r)', '/ r] × (1 - r)', 1))]
    for mutated in mutations:
        try: check_exact_recovered_values(*mutated)
        except AssertionError: pass
        else: raise AssertionError('Exact guard accepted an academic mutation')

def run_academic_negative_guards():
    print("Running Academic Negative Guards...")

    fixtures_path = root / 'docs' / 'practice-review' / 'academic-source-fixtures.json'
    assert fixtures_path.exists(), f"academic-source-fixtures.json not found at {fixtures_path}"
    fixtures = json.loads(fixtures_path.read_text(encoding='utf-8'))
    
    # 1. TLUD guards
    tlud = (root / 'TAM_LY_UNG_DUNG.html').read_text(encoding='utf-8')
    tlud_public = re.sub(r'<!--.*?-->|<(script|style)\b[^>]*>.*?</\1>', '', tlud, flags=re.S | re.I)
    tlud_public = ' '.join(unescape(re.sub(r'<[^>]+>', ' ', tlud_public)).split()).casefold()
    for residue in ['chuyên đề mở rộng', 'p.15 states']:
        assert residue not in tlud_public, f"TLUD public residue: '{residue}'"
    source_tags = re.findall(r'<span\b[^>]*class=[\"\'][^\"\']*\bsource-tag\b[^\"\']*[\"\'][^>]*>(.*?)</span>', tlud, re.S | re.I)
    for tag in source_tags:
        label = ' '.join(unescape(re.sub(r'<[^>]+>', '', tag)).split())
        assert label not in {', p.14', ', p.48', '·'}, f"TLUD malformed source tag: '{label}'"
    for term in fixtures['TLUD']['prohibited_public_terms']:
        assert term not in tlud, f"TLUD still contains prohibited term: '{term}'"
    for module in fixtures['TLUD']['modules']:
        for theory in module['theories']:
            assert theory in tlud, f"TLUD missing theory '{theory}' from fixture module {module['id']}"
    assert 'Intrinsic Motivation' in tlud, "TLUD missing Intrinsic Motivation"
    assert 'Yerkes-Dodson' not in tlud, "TLUD should not contain unsourced Yerkes-Dodson"
    assert 'Deci & Ryan' not in tlud, "TLUD should not contain unsourced Deci & Ryan"
    assert 'Self-Determination' not in tlud, "TLUD should not contain unsourced Self-Determination"
    assert 'Schacter 2020' not in tlud, "TLUD should not cite Schacter 2020"
    assert 'Schacter et al. (2020)' not in tlud, "TLUD should not cite Schacter et al. (2020)"
    print("  PASS: TLUD Academic Negative Guards (contract checked; independent source status recorded in fixture provenance)")

    # 2. KTQT guards
    ktqt = (root / 'KINH_TE_QUOC_TE.html').read_text(encoding='utf-8')
    assert 'limited-box' not in ktqt, "KTQT Ch5/Ch6 still contains placeholder limited-box"
    assert 'VMPK' in ktqt, "KTQT missing VMPK model"
    assert 'VMPL' in ktqt, "KTQT missing VMPL model"
    assert fixtures['KTQT']['capital_demand_equation'] in ktqt, "KTQT missing capital numerical exercise equation"
    assert fixtures['KTQT']['labor_demand_equations']['country_1'] in ktqt, "KTQT missing labor numerical exercise QL1"
    assert fixtures['KTQT']['labor_demand_equations']['country_2'] in ktqt, "KTQT missing labor numerical exercise QL2"
    assert '25 triệu USD' in ktqt, "KTQT missing 25M USD welfare gain"
    assert '50 triệu USD' in ktqt, "KTQT missing 50M USD world welfare gain"
    assert 'BCC' in ktqt, "KTQT missing BCC FDI form"
    assert 'BOT' in ktqt, "KTQT missing BOT FDI form"
    assert 'Trade Creation' in ktqt and 'Trade Diversion' in ktqt, "KTQT missing Customs Union theory"
    assert 'Jacob Viner' in ktqt, "KTQT missing Jacob Viner"
    assert fixtures['KTQT']['customs_union_welfare']['trade_creation'] in ktqt, "KTQT missing trade creation welfare (b+d)"
    assert fixtures['KTQT']['customs_union_welfare']['trade_diversion'] in ktqt, "KTQT missing trade diversion welfare ((b+d)-e)"
    print("  PASS: KTQT Academic Negative Guards (contract checked; independent source status recorded in fixture provenance)")

    # 3. TCCN guards
    tccn = (root / 'TAI_CHINH_CA_NHAN.html').read_text(encoding='utf-8')
    assert 'Exact criteria / percentages unavailable' not in tccn, "TCCN still has placeholder for credit score criteria"
    assert 'Chưa có số liệu đồ thị để so sánh định lượng' not in tccn, "TCCN still has placeholder for credit comparison"
    for weight_name, weight_val in fixtures['TCCN']['credit_score_weights'].items():
        pct_str = f"{int(weight_val * 100)}%"
        assert pct_str in tccn, f"TCCN missing percentage {pct_str} for {weight_name}"
    assert fixtures['TCCN']['loan_durations_legal']['regulation'] in tccn, "TCCN loan duration not attributed to Thông tư 39"
    assert 'Khoản 1' in tccn and 'Khoản 2' in tccn and 'Khoản 3' in tccn, "TCCN missing Thông tư 39 clauses"
    assert 'FICO MODEL' not in tccn, "TCCN has forbidden FICO MODEL in main heading"
    assert 'FICO · CIC · xếp hạng tín dụng' not in tccn, "TCCN mindmap still leaks FICO CIC"
    assert 'an toàn < 50%' not in tccn and '< 50%' not in tccn[tccn.find('Tỷ số nợ (Debt Ratio)'):tccn.find('Tỷ số nợ (Debt Ratio)') + 300], "TCCN still has arbitrary < 50% threshold on Debt Ratio"
    print("  PASS: TCCN Academic Negative Guards (contract checked; independent source status recorded in fixture provenance)")

    # 4. NLTTTC guards
    nltttc = (root / 'NGUYEN_LY_THI_TRUONG_TAI_CHINH.html').read_text(encoding='utf-8')
    check_exact_recovered_values(ktqt, nltttc)
    exact_guard_self_test(ktqt, nltttc)
    assert 'locked-card' not in nltttc, "NLTTTC still contains locked-card placeholders"
    assert 'Chuyên đề đọc thêm mở rộng' not in nltttc, "NLTTTC still contains 'Chuyên đề đọc thêm mở rộng'"
    assert '[cần làm rõ số mũ]' not in nltttc, "NLTTTC still contains '[cần làm rõ số mũ]'"
    assert '[blocked]' not in nltttc, "NLTTTC still contains '[blocked]' placeholders"
    assert 'Policy locked' not in nltttc, "NLTTTC still contains 'Policy locked' placeholders"
    assert 'Blocked pending verification' not in nltttc, "NLTTTC still contains 'Blocked pending verification'"
    assert 'Tài chính bền vững (Sustainable Finance)' in nltttc, "NLTTTC missing Sustainable Finance"
    assert 'Tài chính phi tập trung (DeFi)' in nltttc, "NLTTTC missing DeFi"
    assert 'Khủng hoảng tài chính (Financial Crises)' in nltttc, "NLTTTC missing Financial Crises"
    assert 'Tổng quan rủi ro tài chính (Financial Risks)' in nltttc, "NLTTTC missing Financial Risks"
    assert 'Financial Crises - Mishkin Ch. 9' not in nltttc, "NLTTTC contains inaccurate Mishkin Ch. 9"
    assert 'Financial Risks - Mishkin Ch. 22 & 23' not in nltttc, "NLTTTC contains inaccurate Mishkin Ch. 22 & 23"
    assert 'Derivatives - Mishkin Ch. 24' not in nltttc, "NLTTTC contains inaccurate Mishkin Ch. 24"
    assert 'Dòng tiền đều đầu kỳ (Annuity Due - Mishkin Ch. 4)' in nltttc, "NLTTTC missing Annuity Due"
    assert 'Tam giác bất khả thi' in nltttc, "NLTTTC missing Impossible Trinity"
    assert 'FV = P × (1 + i/n)' in nltttc, "NLTTTC missing Compound interest formula"
    assert 'EAR = (1 + i/n)' in nltttc, "NLTTTC missing EAR formula"

    # 4b. Quiz consistency check for NLTTTC Direct Quotation
    ch6_idx = nltttc.find('id="quiz-ch6"')
    assert ch6_idx != -1, "NLTTTC id='quiz-ch6' container not found"
    ch6_block = nltttc[ch6_idx:ch6_idx + 2500]
    ch6_q = re.search(r'<div class="quiz-q"[^>]*data-answer="([^"]+)"[^>]*>.*?USD/VND = 22,750.*?<div class="feedback"[^>]*data-explanation="([^"]+)"', ch6_block, re.DOTALL)
    assert ch6_q is not None, "NLTTTC Ch.6 direct quotation quiz not found in quiz-ch6"
    q_ans, q_exp = ch6_q.group(1), ch6_q.group(2)
    expected_ans = fixtures['NLTTTC']['quiz_ch6_direct_quotation']['correct_answer']
    assert q_ans == expected_ans, f"Quiz question answer mismatch: expected {expected_ans}, got {q_ans}"
    assert expected_ans in q_exp, f"Quiz question explanation mismatch: '{expected_ans}' not in '{q_exp}'"
    assert "indirect quotation" not in q_exp.lower() or "direct quotation" in q_exp.lower(), f"Quiz explanation has contradiction"
    assert not q_exp.strip().lower().startswith("đây là indirect quotation"), f"Quiz explanation wrongly asserts indirect quotation"
    print("  PASS: NLTTTC Academic Negative Guards & Quiz Consistency")

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
