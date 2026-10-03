"""Record the completed, explicit image review; do not infer it from measurements."""
import json
from pathlib import Path

PACKAGE = Path(__file__).resolve().parents[1]

def load(name):
    return json.loads((PACKAGE / name).read_text(encoding='utf-8'))

progress = load('implementation/visual-review-progress.json')
contacts = PACKAGE / 'evidence/after/contact-sheets'
sources = {
    'main_gallery': contacts,
    'KTTC_replacement': contacts / '_KTTC',
    'NLKT_replacement': contacts / '_NLKT',
    'PTBV_replacement': contacts / '_PTBV',
    'practice_replacement': contacts / '_NguyenLyKeToan_LuyenDe__TCCN_LuyenDe__NhapMonLuatHoc_LuyenDe__KTQT_LuyenDe__LTMQT_LuyenDe__NLTTTC_LuyenDe',
    'TCCN_replacement': contacts / '_TCCN',
    'gradient_components': contacts / 'gradient-components',
}
reviewed = {}
for key, folder in sources.items():
    reviewed[key] = {}
    for tile in load(str(folder.relative_to(PACKAGE) / 'index.json'))['index']:
        reviewed[key].setdefault(tile['coverage_id'], []).append(tile)

scoped = {('STKN', 'ch1'), ('STKN', 'ch3'), ('STKN', 'ch7'),
          ('VHDDTKD', 'ch1'), ('VHDDTKD', 'ch3'), ('LTMQT', 'ch5'),
          ('TLUD', 'ch1'), ('TCCN', 'ch6'), ('KTQT', 'ch3')}
diagram = load('evidence/after/diagram-acceptance/results.json')
assert len(diagram) == 36 and all(r['pass'] for r in diagram)
assert len(progress['diagram_gallery']['reviewed_sheets']) == 8
assert len(progress['diagram_zoom_gallery']['reviewed_sheets']) == 5
assert len(progress['pyramid_native']['reviewed_images']) == 8
anchor = load('evidence/after/anchor/results.json')
assert len(anchor) == 4 and all(r['pass'] for r in anchor)
assert len(progress['anchor_native']['reviewed_images']) == 4

render = load('evidence/after/render/results.json')['results']
assert len(render) == 416 and all(r['automated_status'] == 'PASS' for r in render)
output = {}
for row in render:
    route = row['route'].strip('/')
    key = {'KTTC': 'KTTC_replacement', 'NLKT': 'NLKT_replacement',
           'PTBV': 'PTBV_replacement', 'TCCN':'TCCN_replacement'}.get(route, 'main_gallery')
    if row['coverage_id'] in reviewed['gradient_components']:
        key='gradient_components'
    if 'LuyenDe' in route:
        key = 'practice_replacement'
    tiles = reviewed[key][row['coverage_id']]
    assert all(t['sheet'] in progress[key]['reviewed_sheets'] for t in tiles), row['coverage_id']
    images = [str((sources[key] / s).relative_to(PACKAGE)).replace('\\', '/')
              for s in dict.fromkeys(t['sheet'] for t in tiles)]
    supplements = []
    if (route, row['state']) in scoped:
        case = next(r for r in diagram if (r['route'], r['tab'], r['width']) == (route, row['state'], row['width']))
        supplements += case['evidence']
    if route == 'TLUD' and row['state'] == 'ch1':
        supplements += [r['evidence'] for r in load('evidence/after/pyramid/results.json') if r['width'] == row['width']]
    if route == 'TCCN' and row['state'] == 'ch1':
        supplements += [r['evidence'] for r in anchor if r['width'] == row['width']]
    output[row['coverage_id']] = {
        'full_body_status': 'PASS', 'font_glyphs': 'PASS', 'headings_palette': 'PASS',
        'card_spacing': 'PASS', 'tables_diagrams': 'PASS',
        'review_method': 'Actual image inspection of every full-body survey tile; native captures, text-bound metrics and targeted interactions supplement the survey.',
        'reviewed_sheets': images, 'scoped_replacement_evidence': supplements,
        'notes': 'Whole chapter/mode body inspected, including disclosures and both card faces. '
                 + ('Later changes confined to the explicitly reviewed replacement components listed here.' if supplements else 'Accepted whole-body layout; route replacement survey used where applicable.')
    }
(PACKAGE / 'implementation/visual-review.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

practice = load('evidence/after/practice-reading/results.json')
assert len(practice) == 184 and all(r['pass'] for r in practice)
assert len(progress['practice_reading_gallery']['reviewed_sheets']) == 40
index = load('evidence/after/practice-reading/gallery/index.json')['index']
practice_review = {}
for row in practice:
    filenames = [Path(s).name for s in row['evidence']]
    tiles = [t for t in index if t['file'] in filenames]
    assert tiles and all(t['sheet'] in progress['practice_reading_gallery']['reviewed_sheets'] for t in tiles)
    practice_review[row['state_test_id']] = {
        'status': 'PASS', 'evidence': row['evidence'],
        'reviewed_sheets': list(dict.fromkeys('evidence/after/practice-reading/gallery/' + t['sheet'] for t in tiles)),
        'notes': 'All question/option/explanation bounds checked; longest open and graded cards or complete guided-case body actually inspected. Sticky headers can intersect auto-scrolled element captures; whole-body/native scrolling views supplement those regions.'
    }
(PACKAGE / 'implementation/practice-visual-review.json').write_text(json.dumps(practice_review, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Recorded actual visual acceptance: 416 render states and 184 practice states.')
