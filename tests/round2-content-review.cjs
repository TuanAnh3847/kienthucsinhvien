// One-time reviewed edits. Original ambiguous items are retained in non-hosted docs.
const fs=require('node:fs'),vm=require('node:vm');
fs.mkdirSync('docs/practice-review',{recursive:true});
let s=fs.readFileSync('TCCN-LuyenDe.html','utf8');
const pattern=/(<script id="question-data" type="application\/json">)([\s\S]*?)(<\/script>)/;
const bank=JSON.parse(s.match(pattern)[2]);
const reasons={
 e1_q20:'Theory Chapter 4 explicitly records competing meanings of disposable income; the unqualified question has no safe unique definition.',
 e1_q31:'Theory Chapter 4 warns against a universal net-worth conclusion; the stem supplies no fee or penalty assumption.',
 e3_q36:'The stem says their but supplies no household data or context; guessing the intended missing case is unsafe.',
 e3_q43:'Claim about Vietnamese households has no supporting survey/data in current theory; explanation appeals to the LMS key.'
};
fs.writeFileSync('docs/practice-review/held-finance-questions.json',JSON.stringify(bank.filter(q=>reasons[q.id]).map(q=>({reason:reasons[q.id],question:q})),null,2)+'\n');
for(const q of bank){
 q.explanation=q.explanation.replace('không đủ theo đáp án LMS.','không đủ.').replace('đủ theo đáp án LMS.','đủ.');
}
s=s.replace(pattern,(_,a,b,c)=>a+'\n'+JSON.stringify(bank.filter(q=>!reasons[q.id]),null,2)+'\n'+c);
fs.writeFileSync('TCCN-LuyenDe.html',s);
let a=fs.readFileSync('NguyenLyKeToan-LuyenDe.html','utf8');
const match=a.match(/const LOCAL_SETS = ([\s\S]*?);\r?\n/);
const sets=vm.runInNewContext(match[1]);const abc=sets.find(x=>x.id==='exam-abc-company');
fs.writeFileSync('docs/practice-review/abc-incomplete-original.json',JSON.stringify({reason:'January transactions lack amounts; ending solution cannot be reconstructed. Keep only the fully specified opening-balance exercise.',set:abc},null,2)+'\n');
abc.title='Practice Test 1: ABC Company Opening Position';
abc.description='Calculate opening assets, liabilities and equity, then prepare the Statement of Financial Position.';
abc.requirements=abc.requirements.slice(0,4);
abc.caseHtml=abc.caseHtml.slice(0,abc.caseHtml.indexOf("<p class='mt-4'>"));
abc.solutionHtml=abc.solutionHtml.slice(0,abc.solutionHtml.indexOf("<div><h4 class='font-black text-teal-800 mb-2'>B."))+'</div>';
a=a.replace(match[0],'const LOCAL_SETS = '+JSON.stringify(sets)+';\n');
fs.writeFileSync('NguyenLyKeToan-LuyenDe.html',a);
let home=fs.readFileSync('index.html','utf8');
home=home.replaceAll('hệ E UEL.','dành cho sinh viên.').replaceAll('Hệ E UEL','Luyện tập').replace('Trắc nghiệm online tự động chấm điểm &amp; Bài tập tự luận hệ E có giải','Trắc nghiệm tự động chấm điểm &amp; bài tập tự luận có giải').replace('Luyện 150 câu từ 3 đề LMS, có test nhanh, luyện theo chương, đề 50 câu có timer và giải thích chi tiết.','Luyện theo chương, làm bài nhanh hoặc đề tổng hợp có đồng hồ; xem kết quả và giải thích sau khi làm bài.');
fs.writeFileSync('index.html',home);
