const fs=require('node:fs'),path=require('node:path');
const {spawn,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=process.env.RUNBOOK_OUTPUT?path.resolve(root,process.env.RUNBOOK_OUTPUT):path.join(root,'docs/edu-connect-handoff-2026-10-03/evidence/after/logs');fs.mkdirSync(out,{recursive:true});
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true}).trim();
const python='C:/Users/ASUS/AppData/Local/Programs/Python/Python312/python.exe';
const checks=[
 ['html5',python,['tests/html_check.py']],
 ['preservation',python,['tests/preservation_check.py','5b0e619fb6838363a79dcb2966a6c138375a59ec']],
 ['academic-self-test',python,['tests/content_check.py','--self-test']],
 ['current-base-self-test',python,['tests/handoff_preservation.py','--self-test']],
 ['practice-trace',python,['tests/practice_trace_check.py']],
 ...['auth.js','admin.js','edu-header.js','edu-study.js','reading.js'].map(f=>['syntax-'+f,process.execPath,['--check',f]]),
 ['diff-check','git',['diff','--check']],
 ...['audit','regression','practice-behavior','student-acceptance','theory-interactions','component-overflow','nightly-qa','handoff-targeted'].map(f=>[f,process.execPath,['tests/'+f+'.cjs']])
];
const results=process.env.RUNBOOK_STATIC_ONLY && fs.existsSync(path.join(out,'runbook-results.json'))
 ? JSON.parse(fs.readFileSync(path.join(out,'runbook-results.json'),'utf8')).filter(r=>checks.slice(11).some(c=>c[0]===r.name)) : [];
async function run([name,command,args]){
 const file=path.join(out,name+'.log'),stream=fs.createWriteStream(file),start=new Date().toISOString();
 const proc=spawn(command,args,{cwd:root,env:{...process.env,PYTHONIOENCODING:'utf-8'},windowsHide:true,shell:false});proc.stdout.pipe(stream);proc.stderr.pipe(stream);
 const exit=await new Promise(resolve=>{proc.on('error',e=>{stream.write(e.stack);resolve(-1)});proc.on('close',resolve)});stream.end();
 results.push({name,source_commit:sourceCommit,screenshots_enabled:process.env.QA_SCREENSHOTS==='1',command:path.basename(command)+' '+args.join(' '),exit_code:exit,status:exit===0?'PASS':'FAIL',started_utc:start,finished_utc:new Date().toISOString(),log:path.relative(root,file).replace(/\\/g,'/')});
 fs.writeFileSync(path.join(out,'runbook-results.json'),JSON.stringify(results,null,2));console.log(exit===0?'PASS':'FAIL',name,exit);
}
(async()=>{for(const check of checks.slice(0,11))await run(check);if(!process.env.RUNBOOK_STATIC_ONLY){const browserChecks=checks.slice(11);let index=0;await Promise.all([0,1].map(async()=>{while(index<browserChecks.length)await run(browserChecks[index++]);}));}if(results.some(r=>r.exit_code!==0))process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});
