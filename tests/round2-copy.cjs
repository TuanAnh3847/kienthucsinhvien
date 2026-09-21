// Reviewed, one-time presentation edits for the second student audit.
const fs=require('node:fs');
function change(file,pairs){let s=fs.readFileSync(file,'utf8');for(const [a,b]of pairs){if(b && s.includes(b))continue;if(!s.includes(a))throw Error(file+': missing '+a);s=s.split(a).join(b)}fs.writeFileSync(file,s)}
change('NguyenLyKeToan-LuyenDe.html',[
 ['<body class="','<body class="edu-practice-page '],
 ['Giao diện tiếng Việt để dễ dùng, nhưng toàn bộ câu hỏi và đề bài được viết bằng tiếng Anh để sát kiểu học hệ E.','Ôn theo chương, thử bài trắc nghiệm và tự đối chiếu lời giải. Câu hỏi bằng tiếng Anh, hướng dẫn thao tác bằng tiếng Việt.'],
 ['<strong>Flow:</strong> Chọn mục → Làm câu hỏi/dè → Nộp bài → Xem đáp án &amp; giải thích → Lưu điểm lên Firestore nếu đã kết nối.','Chọn bài → Làm bài → Nộp bài → Xem kết quả và giải thích → Làm lại để tự kiểm tra.'],
 ['Chọn từng chương để kiểm tra nền tảng trước khi vào đề dài. Hiện bản đầu ưu tiên Chapter 1–3, sau này có thể thêm Chapter 4–6 vào Firestore.','Chọn bài theo chương để kiểm tra nền tảng trước khi vào đề tổng hợp.'],
 ['Built for study practice · Questions in English · UI in Vietnamese','<a href="/NLKT" class="font-bold text-teal-700 underline">← Về lý thuyết Nguyên lý kế toán</a>'],
 ['<section id="practice-panel"','<p class="practice-theory-link"><a href="/NLKT">← Lý thuyết Nguyên lý kế toán</a></p>\n  <section id="practice-panel"'],
 ['Tình trạng nội dung','Bài luyện hiện có'],
 ['https://kienthucsinhvien.id.vn/NguyenLyKeToan-LuyenDe.html','https://kienthucsinhvien.id.vn/NguyenLyKeToan-LuyenDe'],
]);
// This unreachable implementation-status panel has no student navigation.
let nlkt=fs.readFileSync('NguyenLyKeToan-LuyenDe.html','utf8');
nlkt=nlkt.replace(/  <section id="cloud"[\s\S]*?<\/section>\s*/, '');
fs.writeFileSync('NguyenLyKeToan-LuyenDe.html',nlkt);
change('TCCN-LuyenDe.html',[
 ['<body class="','<body class="edu-practice-page '],
 ['Bộ 150 câu ôn tập từ 3 đề LMS, sắp xếp lại thành chế độ học theo chương, test nhanh và luyện thi có đồng hồ. Phần học hiện đáp án ngay; phần luyện thi phải nộp bài mới xem đáp án.','Ôn theo chương, làm bài nhanh hoặc luyện thi có đồng hồ. Chế độ học giải thích ngay sau mỗi lựa chọn; chế độ thi hiện đáp án sau khi nộp.'],
 ['Tình trạng bộ câu hỏi','Bài luyện hiện có'],
 ['<strong>Flow:</strong>','<strong>Cách luyện:</strong>'],
 ['Không cần database, không tốn Firestore.','Bạn có thể ôn lại rồi xóa những câu đã nắm chắc.'],
 ['Static-first · Không Firestore · Built for UEL English Program','<a href="/TCCN" class="font-bold text-teal-700 underline">← Về lý thuyết Tài chính cá nhân</a>'],
 ['<section id="practice-panel"','<p class="practice-theory-link"><a href="/TCCN">← Lý thuyết Tài chính cá nhân</a></p><p id="storage-status" role="status" class="text-sm text-amber-800"></p>\n  <section id="practice-panel"'],
 ['<strong>${answered}</strong>/${s.questions.length} câu đã chọn','<strong data-answered-count>${answered}</strong>/${s.questions.length} câu đã chọn'],
 ['onclick="submitSession(false)" class=','onclick="submitSession(false)" ${sessionSubmitted?\'disabled\':\'\'} class='],
 ['onclick="finishStudySession()" class=','onclick="finishStudySession()" ${sessionSubmitted?\'disabled\':\'\'} class='],
 ['${isCorrect?\'Đúng\':\'Sai\'}','${selected === undefined ? \'Chưa trả lời\' : isCorrect?\'Đúng\':\'Sai\'}'],
 ['<span class="text-[11px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">${q.clo}</span>',''],
 ['<span class="text-[11px] font-black px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">Đề ${q.sourceExam} · Câu ${q.sourceNumber}</span>',''],
 ['onclick="selectAnswer(\'${q.id}\',${oi})" ${disabled}','onclick="selectAnswer(\'${q.id}\',${oi})" aria-pressed="${selected}" ${disabled}'],
 ["'Ngon rồi bro, nền khá chắc 🔥':percent>=60?'Ổn áp, nhưng vẫn nên chữa câu sai':'Cần ôn lại trọng tâm trước khi thi nha bro'","'Bạn đã nắm khá chắc nội dung bài luyện':percent>=60?'Hãy xem lại các câu chưa đúng để củng cố kiến thức':'Hãy ôn lại lý thuyết rồi thử sức lần nữa'"],
 ['onclick="scrollToFirstWrong()" class=','onclick="scrollToFirstWrong()" ${score===total?\'disabled\':\'\'} class='],
 ['Xem câu sai đầu tiên','Xem câu sai hoặc chưa trả lời'],
 ['>đề LMS<','>bộ luyện thi<'],
 ['subtitle:`50 câu từ bộ LMS số ${n}`','subtitle:`Bộ câu hỏi tổng hợp ${n}`'],
 ['Mode học theo chương:','Luyện theo chương:'],['Mode này hiện đáp án ngay','Chế độ này hiện đáp án ngay'],["'Mode học'","'Luyện tập'"],
]);
change('index.html',[
 ['hệ E UEL.','dành cho sinh viên.'],
 ['Trắc nghiệm online tự động chấm điểm &amp; Bài tập tự luận hệ E có giải','Trắc nghiệm tự động chấm điểm &amp; bài tập tự luận có giải'],
 ['HỆ E UEL','LUYỆN TẬP'],
 ['Luyện 150 câu từ 3 đề LMS, có test nhanh, luyện theo chương, đề 50 câu có timer và giải thích chi tiết.','Luyện theo chương, làm bài nhanh hoặc đề tổng hợp có đồng hồ; xem kết quả và giải thích sau khi làm bài.'],
]);
