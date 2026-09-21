// One-time publication of questions reviewed in docs/practice-review.
const fs=require('node:fs'),vm=require('node:vm');
const file='docs/practice-review/new-question-review.json';
const review=JSON.parse(fs.readFileSync(file));
review.sources={accounting:'NGUYEN_LY_KE_TOAN.html',finance:'TAI_CHINH_CA_NHAN.html'};
for(const q of review.finance){if(q.heading==='Psychology')q.heading='Psychology & Behavioral Biases';if(q.id==='f2_3')q.options[3]='Procrastination';if(q.id==='f2_4')q.options=['Mental Accounting','Anchoring Effect','Diderot Effect','Bandwagon Effect'];}
Object.assign(review.finance.find(q=>q.id==='f2_9'),{heading:'Revolving saving fund — irregular expenses',quote:'funds are allocated to create savings that can pay irregular expenses',question:'Which budgeting tool sets aside funds for irregular expenses and occasional deficits caused by income fluctuations?',options:['Revolving saving fund','Treating every irregular expense as new income','Ignoring the financial calendar','Removing all saving goals'],explanation:'Revolving saving fund dành trước nguồn tiết kiệm để chi cho khoản không đều và thiếu hụt tạm thời do thu nhập biến động.'});
Object.assign(review.finance.find(q=>q.id==='f2_10'),{heading:'What is a budget?',quote:'A paper or electronic document recording planned and actual income and expenditures over a period.',question:'Which document records planned and actual income and spending so that a financial plan can be put into practice?',options:['A budget','Only a list of assets at one date','Only the outstanding debt balance','Only an insurance contract'],explanation:'Budget ghi thu nhập và chi tiêu dự kiến lẫn thực tế trong một kỳ, giúp thực hiện kế hoạch chi tiêu và tiết kiệm.'});
fs.writeFileSync(file,JSON.stringify(review,null,2)+'\n');
function published(q,i){const options=[...q.options];const shift=i%4;for(let j=0;j<shift;j++)options.push(options.shift());return{id:q.id,question:q.question,options,answer:(4-shift)%4,explanation:q.explanation};}
let n=fs.readFileSync('NguyenLyKeToan-LuyenDe.html','utf8');const match=n.match(/const LOCAL_SETS = ([\s\S]*?);\r?\n/);const sets=vm.runInNewContext(match[1]);
if(sets.some(s=>s.id==='quiz-applied-review-12'))throw Error('Already published');
sets.push({id:'quiz-applied-review-12',title:'Applied Review: Principles, Measurement & Production',category:'quiz',mode:'mcq',chapter:'Chapter 1–6',difficulty:'Medium',duration:20,description:'Apply accounting assumptions, measurement methods, document flow and production-cost relationships.',badge:'Ôn tập vận dụng',order:9,questions:review.accounting.map(published)});
n=n.replace(match[0],'const LOCAL_SETS = '+JSON.stringify(sets)+';\n');fs.writeFileSync('NguyenLyKeToan-LuyenDe.html',n);
let f=fs.readFileSync('TCCN-LuyenDe.html','utf8');const pattern=/(<script id="question-data" type="application\/json">)([\s\S]*?)(<\/script>)/;const bank=JSON.parse(f.match(pattern)[2]);
const chapters={'ch1':'Chapter 1: Personal Finance Foundations','ch2':'Chapter 2: Career, Income & Life Cycle','ch3':'Chapter 3: Financial Products & Investment','ch4':'Chapter 4: Statements, Ratios & Budgeting','ch5':'Chapter 5: Protection & Insurance'};
review.finance.forEach((q,i)=>{const p=published(q,i);bank.push({...p,correctText:p.options[p.answer],sourceExam:4,sourceNumber:i+1,clo:'',chapter:chapters[q.chapter],keyword:'',trap:''})});
f=f.replace(pattern,(_,a,b,c)=>a+'\n'+JSON.stringify(bank,null,2)+'\n'+c);
f=f.replace("cards.push({type:'random'", "cards.push({type:'review', title:'Vận dụng: hành vi, ngân sách & bảo hiểm', subtitle:'12 câu liên kết kiến thức Chương 1–5', questions:QUESTION_BANK.filter(q=>q.sourceExam===4), minutes:20, accent:'teal'});\n  cards.push({type:'random'");
// New concise explanations do not need empty keyword/trap panels.
f=f.replace('<div class="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm"><strong', '${q.keyword || q.trap ? `<div class="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm"><strong');
f=f.replace('${escapeHtml(q.trap)}</p></div>','${escapeHtml(q.trap)}</p></div>` : \'\'}');
fs.writeFileSync('TCCN-LuyenDe.html',f);
