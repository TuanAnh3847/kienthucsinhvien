"""Verify that the audit preserves all existing chapter text."""
from pathlib import Path
import subprocess
import sys
import re
sys.path.insert(0, str(Path(__file__).parent / '.python'))
import html5lib

root = Path(__file__).resolve().parent.parent
baseline = sys.argv[1] if len(sys.argv) > 1 else 'main'

def chapters(source):
    tree = html5lib.parse(source)
    for parent in tree.iter():
        for child in list(parent):
            if not isinstance(child.tag, str):
                parent.remove(child)
    return {
        el.attrib['id']: re.sub(r'\s+', ' ', ''.join(el.itertext())).strip()
        for el in tree.iter()
        if 'tab-content' in el.attrib.get('class', '').split()
        and 'id' in el.attrib
    }

count = 0
for file in root.glob('*.html'):
    old = subprocess.check_output(['git', 'show', f'{baseline}:{file.name}'], cwd=root).decode('utf-8')
    original = chapters(old)
    current = chapters(file.read_text(encoding='utf-8'))
    assert original == current, f'Chapter text changed: {file.name}'
    count += len(original)
print(f'Preserved chapter text: {count} sections')
