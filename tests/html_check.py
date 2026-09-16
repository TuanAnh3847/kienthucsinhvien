"""HTML5 parse errors, duplicate IDs and inline JavaScript inventory."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent / '.python'))
import html5lib

root = Path(__file__).resolve().parent.parent
errors = 0
for file in sorted(root.glob('*.html')):
    parser = html5lib.HTMLParser()
    tree = parser.parse(file.read_text(encoding='utf-8'))
    ids = [el.attrib['id'] for el in tree.iter() if 'id' in el.attrib]
    duplicates = sorted({i for i in ids if ids.count(i) > 1})
    if parser.errors or duplicates:
        print(file.name, 'duplicate IDs:', duplicates)
        for err in parser.errors:
            print(' ', err)
        errors += len(parser.errors) + len(duplicates)
print(f'HTML5 check: {errors} errors')
sys.exit(bool(errors))
