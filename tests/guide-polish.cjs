const fs=require('node:fs');
const guides={
 '/KTTC':[
  ['Sơ đồ dòng tài khoản','theo dõi luồng Nợ/Có và quan hệ giữa 152–154–155–632, 121/128/22x, 131/331, 911–4212.'],
  ['Thực hành từng bước','dùng máy tính, bài phân loại và bảng thực hành để kiểm tra cách hạch toán.'],
  ['Thẻ ghi nhớ và sơ đồ ôn tập','củng cố số tài khoản, công thức, ngưỡng và các cặp dễ nhầm.']],
 '/KTQT':[
  ['Máy tính và mô hình','thử tính năng suất, chi phí cơ hội, thuế quan, hạn ngạch, trợ cấp và ERP.'],
  ['Đọc đồ thị','khám phá PPF, CIC/MRS, lợi ích thương mại, các vùng phúc lợi và mô hình H-O-S.'],
  ['Thẻ ghi nhớ và so sánh','ôn theo cụm khái niệm dễ nhầm, bảng so sánh và ví dụ.']],
 '/LTMQT':[
  ['Sơ đồ và cây quyết định','dùng dòng thời gian và sơ đồ phân cấp để nắm cấu trúc pháp lý.'],
  ['Bảng dữ liệu','luyện đọc chính xác mức thuế, mốc thời gian và các ví dụ HS.'],
  ['Ghép cặp và sắp xếp','ghép vụ việc với nhận định, tổ chức với vai trò và sắp xếp các bước.']],
 '/NLKT':[
  ['Học bằng sơ đồ và bảng','đối chiếu luồng hạch toán, tài khoản chữ T và cấu trúc báo cáo.'],
  ['Thử ngay tương tác','phân loại, sắp xếp, ghép khái niệm, dựng bút toán và xem lại ví dụ.'],
  ['Tính với công thức đã học','dùng máy tính để kiểm tra từng bước; tự hoàn thiện các bài chưa có lời giải mẫu.']],
 '/NLTTTC':[
  ['Sơ đồ và bảng so sánh','kết nối SSU–DSU, cấu trúc thị trường, công cụ tài chính và công thức.'],
  ['Ghép cặp và phân loại','ôn chức năng, đặc điểm, cầu tài sản, nhóm thị trường và vấn đề thông tin.'],
  ['Máy tính và bảng công thức','thử công thức đã học; chú ý các ký hiệu cần làm rõ trước khi tính.']],
 '/PTBV':[
  ['Sơ đồ và so sánh','phân biệt Growth/Development, Policy/Strategy và Crisis/Conflict/Compromise.'],
  ['Tự phân loại','ghép chỉ báo, các bên liên quan và công cụ chính sách với đúng nhóm.'],
  ['Ôn nhanh','lật thẻ, mở câu hỏi kiểm tra và dùng phần Review để kết nối cả 5 chương.']],
 '/STKN':[
  ['Nhìn cấu trúc','dùng sơ đồ, Venn, ma trận, ARES, Empathy Map và BMC để kết nối kiến thức.'],
  ['Tự kiểm tra','sắp xếp, ghép cặp và phân loại để nhớ trình tự, vai trò và nhóm khái niệm.'],
  ['Tự xây dựng ý tưởng','ghi chú và thử lập luận trong các bài mở Empathy Map, AEIOU, ARES và BMC.']],
 '/TCCN':[
  ['Sơ đồ và bảng so sánh','học qua mối quan hệ, quy trình, phân loại và dữ liệu minh họa.'],
  ['Tự nhập số để tính','thực hành Net Worth, Cash Flow, Compound Interest và hai công thức bảo hiểm.'],
  ['Ghép cặp và thẻ ghi nhớ','kiểm tra khái niệm, trình tự và thuật ngữ trong từng chương.']],
 '/TLUD':[
  ['Ghép cặp và phân loại','phân biệt trường phái, Gestalt, lý thuyết cảm xúc và 5 Fs.'],
  ['Thực hành','thử Weber, digit span, anagram và water-container để hiểu cách vận dụng.'],
  ['Thẻ ghi nhớ và ôn tập','lật thẻ theo chương, đánh dấu “Need review” và ôn định nghĩa, phân loại, quy trình.']],
 '/VHDDTKD':[
  ['So sánh tương tác','phân biệt EPRG, Hofstede, Trompenaars, văn hóa tổ chức và cách tiếp cận đạo đức.'],
  ['Mô hình và bảng số liệu','học qua các lớp văn hóa, ma trận và sơ đồ quy trình.'],
  ['Thẻ ghi nhớ và ôn tập','củng cố định nghĩa, các điểm dễ nhầm và công thức khái niệm Expectancy.']]
};
for(const r of JSON.parse(fs.readFileSync('firebase.json')).hosting.rewrites){
 if(!guides[r.source])continue;
 const file=r.destination.slice(1);let s=fs.readFileSync(file,'utf8'),i=0;
 s=s.replace(/<div class="study-guide-item">[\s\S]*?<\/div>/g,()=>{
  const [heading,body]=guides[r.source][i++];
  return `<div class="study-guide-item"><span class="study-guide-check">✓</span><span><strong>${heading}:</strong> ${body}</span></div>`;
 });
 if(i!==3)throw Error('Unexpected guide structure: '+file);
 fs.writeFileSync(file,s);
}
