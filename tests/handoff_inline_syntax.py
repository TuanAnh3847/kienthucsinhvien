"""Compile every executable inline script and event handler without executing it."""
from pathlib import Path
import json, subprocess, sys
sys.path.insert(0, str(Path(__file__).parent / '.python'))
import html5lib

root=Path(__file__).resolve().parent.parent
results=[]
for file in sorted(root.glob('*.html')):
    tree=html5lib.parse(file.read_text(encoding='utf-8'))
    for index,node in enumerate(tree.iter()):
        if not isinstance(node.tag,str):continue
        tag=node.tag.split('}')[-1]
        script_type=node.attrib.get('type','').lower()
        if tag=='script' and 'src' not in node.attrib and script_type in ('','text/javascript','application/javascript','module') and node.text:
            command=['node','--input-type='+('module' if script_type=='module' else 'commonjs'),'--check']
            proc=subprocess.run(command,input=node.text,text=True,encoding='utf-8',capture_output=True)
            results.append({'file':file.name,'element':index,'kind':'inline script','exit_code':proc.returncode,'diagnostics':proc.stderr})
        for attr,value in node.attrib.items():
            if attr.startswith('on'):
                proc=subprocess.run(['node','--check'],input='function handler(event) {\n'+value+'\n}',text=True,encoding='utf-8',capture_output=True)
                results.append({'file':file.name,'element':index,'kind':attr,'exit_code':proc.returncode,'diagnostics':proc.stderr})
out=root/'docs/edu-connect-handoff-2026-10-03/evidence/after/logs/inline-syntax-results.json'
out.write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
scripts=sum(r['kind']=='inline script' for r in results)
print('Inline scripts:',scripts,'event handlers:',len(results)-scripts,'failures:',sum(r['exit_code']!=0 for r in results))
for result in results:
    if result['exit_code']:print(result)
sys.exit(any(r['exit_code'] for r in results))
