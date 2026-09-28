"""Compare locked data with a baseline while allowing editorial prose changes."""
from pathlib import Path
from collections import Counter
import subprocess
import json
import re
import sys
sys.path.insert(0, str(Path(__file__).parent / '.python'))
import html5lib

root = Path(__file__).resolve().parent.parent
baseline = sys.argv[1] if len(sys.argv) > 1 else 'main'
routes = json.loads((root / 'firebase.json').read_text())['hosting']['rewrites']
old_config = json.loads(subprocess.check_output(['git', 'show', f'{baseline}:firebase.json'], cwd=root))
assert routes == old_config['hosting']['rewrites'], 'Short routes changed'
ns = '{http://www.w3.org/1999/xhtml}'

def read_tree(source):
    return html5lib.parse(source)

def snapshot(tree):
    chapters, fields, answers, tables, math, hero = [], [], [], [], [], []
    for el in tree.iter():
        tag = el.tag.replace(ns, '') if isinstance(el.tag, str) else ''
        attrs = el.attrib
        classes = attrs.get('class', '').split()
        text = re.sub(r'\s+', ' ', ''.join(el.itertext())).strip()
        if 'tab-content' in classes:
            chapters.append(attrs.get('id'))
        if tag in ('input', 'option'):
            fields.append((tag, tuple((k, attrs.get(k)) for k in ('id', 'name', 'type', 'value', 'min', 'max', 'step', 'disabled', 'selected'))))
        data = tuple(sorted((k, v) for k, v in attrs.items() if k.startswith('data-') and k not in ('data-content', 'data-flow-detail')))
        if data:
            answers.append((tag, data))
        if tag in ('td', 'th'):
            tables.append(re.findall(r'\d+(?:[.,:/–−-]\d+)*%?', text))
        if tag == 'h1':
            hero.append(text)
        if set(classes) & {'formula-line', 'big-formula', 'formula', 'formula-text'}:
            # The warning suffix is presentation, not part of the expression.
            math.append(text.replace('[dữ liệu trích xuất]', '').replace('[cần làm rõ số mũ]', '').strip())
    return {'chapters': chapters, 'form field constraints and option values': fields,
            'answer and dataset attributes': answers, 'table numeric cells': tables,
            'formula expressions': math, 'hero titles': hero}

ACADEMIC_COMPLETION_FILES = {
    'KINH_TE_QUOC_TE.html',
    'TAM_LY_UNG_DUNG.html',
    'TAI_CHINH_CA_NHAN.html',
    'NGUYEN_LY_THI_TRUONG_TAI_CHINH.html',
}

for route in routes:
    file = route['destination'].lstrip('/')
    old = subprocess.check_output(['git', 'show', f'{baseline}:{file}'], cwd=root).decode('utf-8')
    current = (root / file).read_text(encoding='utf-8')
    before, after = snapshot(read_tree(old)), snapshot(read_tree(current))
    if file in ACADEMIC_COMPLETION_FILES:
        for key in ('chapters', 'hero titles', 'form field constraints and option values'):
            assert before[key] == after[key], f'{file}: changed {key}'
    else:
        for key in before:
            assert before[key] == after[key], f'{file}: changed {key}'
    coverage = 'chapter order, titles and fields; completion content checked separately' if file in ACADEMIC_COMPLETION_FILES else 'chapters, titles, numeric tables, formulas, fields, answer/data attributes'
    print(f'PASS {route["source"]}: {coverage}')

from academic_negative_guards import run_academic_negative_guards
run_academic_negative_guards()

def homepage_cards(source):
    return [re.sub(r'\s+', ' ', ''.join(el.itertext())).strip()
            for el in read_tree(source).iter()
            if 'course-card' in el.attrib.get('class', '').split()]
old_home = subprocess.check_output(['git', 'show', f'{baseline}:index.html'], cwd=root).decode('utf-8')
# Round 2 explicitly requests removal of class-specific public wording.
# Permit this one reviewed phrase; all remaining card text stays protected.
old_home = old_home.replace('Tài Chính Cá Nhân hệ E UEL.', 'Tài Chính Cá Nhân dành cho sinh viên.')
assert homepage_cards(old_home) == homepage_cards((root / 'index.html').read_text(encoding='utf-8')), 'Unexpected homepage card text change'
print('PASS homepage cards (one reviewed class-neutral phrase) and unchanged Firebase short routes')
