// Authored synthetic reading material, not clinical recommendations or verified labels.
const groups={
 'Bên vú và vị trí':[
  'Vú phải không ghi nhận tổn thương khu trú. Vú trái có một nốt giảm âm.',
  'Vú trái không ghi nhận tổn thương khu trú. Vú phải có một nốt giảm âm.',
  'Tổn thương ở vị trí hai giờ vú phải, cách núm vú ba xen ti mét.',
  'Tổn thương ở vị trí mười giờ vú trái, cách núm vú hai xen ti mét.',
  'Khảo sát góc phần tư trên ngoài vú phải và vùng sau núm vú.',
  'Khảo sát góc phần tư dưới trong vú trái và vùng đuôi nách.',
  'Vùng quầng vú bên phải không ghi nhận bất thường trên lần khảo sát này.',
  'Vùng sau quầng vú bên trái có giãn ống tuyến.',
  'Nốt nằm nông, sát da; nốt còn lại nằm sâu, gần cơ ngực.',
  'Mô tả riêng từng bên: vú phải, vú trái, hạch nách phải và hạch nách trái.'
 ],
 'Phủ định và lời tự sửa':[
  'Không thấy hạch nách phải bất thường. Có một hạch nách trái cần mô tả.',
  'Có tăng tưới máu trong tổn thương. Không ghi nhận tăng tưới máu quanh tổn thương.',
  'Chưa ghi nhận vi vôi hóa. Không loại trừ thành phần đặc.',
  'Không có dịch trong nang. Xin sửa lại, có ít dịch trong nang.',
  'Vú phải, xin sửa lại là vú trái, vị trí ba giờ.',
  'Kích thước mười hai, xin sửa lại mười bảy mi li mét.',
  'Không thấy tăng sinh mạch, à có một ít tín hiệu mạch ở ngoại vi.',
  'Hạch có rốn mỡ. Chưa ghi nhận mất rốn mỡ.',
  'Nốt thứ nhất bờ đều. Nốt thứ hai bờ không đều. Không gộp hai nốt.',
  'Chưa đủ thông tin để ghi kết luận; cần đối chiếu kết quả trước.'
 ],
 'Số đo và đơn vị':[
  'Kích thước tám nhân sáu nhân năm mi li mét.',
  'Kích thước mười tám nhân mười sáu nhân mười lăm mi li mét.',
  'Đường kính không phẩy tám xen ti mét, tương ứng tám mi li mét.',
  'Đường kính một phẩy hai xen ti mét. Nốt kế bên một phẩy bảy xen ti mét.',
  'Cách da ba mi li mét, cách núm vú hai phẩy năm xen ti mét.',
  'Vỏ hạch dày hai phẩy ba mi li mét.',
  'Vỏ hạch dày ba phẩy hai mi li mét, không phải hai phẩy ba.',
  'Vị trí một giờ, bảy giờ, mười một giờ và mười hai giờ.',
  'Lần trước chín mi li mét, lần này mười một mi li mét.',
  'Có hai nốt, kích thước lần lượt là sáu và mười sáu mi li mét.'
 ],
 'Hình thái siêu âm':[
  'Khối hình bầu dục, định hướng song song với da, bờ rõ.',
  'Khối hình không đều, định hướng không song song với da.',
  'Cấu trúc giảm âm không đồng nhất, có bóng cản âm phía sau.',
  'Cấu trúc trống âm, có tăng âm phía sau và không thấy thành phần đặc.',
  'Tổn thương hỗn hợp dạng nang và đặc, có vách bên trong.',
  'Bờ tua gai, bờ góc cạnh, bờ không rõ và bờ vi thùy là các từ cần phân biệt.',
  'Có vôi hóa thô. Chưa ghi nhận vi vôi hóa trên hình đang khảo sát.',
  'Giãn ống tuyến, có cấu trúc trong lòng ống cần mô tả riêng.',
  'Dày da, phù mô dưới da, biến đổi cấu trúc mô tuyến.',
  'Hạch hình bầu dục, còn rốn mỡ; vỏ hạch được đo riêng.'
 ],
 'Thuật ngữ và chữ viết tắt':[
  'Đọc theo cách bác sĩ thường dùng: BI-RADS một, BI-RADS hai, BI-RADS ba.',
  'Đọc theo cách bác sĩ thường dùng: BI-RADS bốn A, bốn B và bốn C.',
  'Đọc theo cách bác sĩ thường dùng: BI-RADS năm và BI-RADS sáu.',
  'Siêu âm Doppler màu, Doppler năng lượng, khảo sát tín hiệu mạch.',
  'Sinh thiết kim lõi, core needle biopsy, CNB.',
  'Chọc hút bằng kim nhỏ, fine needle aspiration, FNA.',
  'Sinh thiết vú có hỗ trợ hút chân không, VABB.',
  'Đọc riêng các ký hiệu theo thói quen: ER, PR, HER2 và Ki-67.',
  'Đọc riêng các ký hiệu theo thói quen: DCIS, LCIS và IHC.',
  'Đọc theo thói quen: MRI tuyến vú, CT, mô bệnh học và hóa mô miễn dịch.'
 ],
 'Ngoại khoa liên quan tuyến vú':[
  'Phẫu thuật bảo tồn vú. Cắt toàn bộ tuyến vú. Tái tạo vú.',
  'Sinh thiết hạch cửa. Nạo hạch nách. Mẫu hạch gửi giải phẫu bệnh.',
  'Diện cắt trên, diện cắt dưới, diện cắt trong và diện cắt ngoài.',
  'Diện cắt sâu và diện cắt nông cần được ghi riêng.',
  'Khảo sát vùng sẹo mổ cũ và vùng giường u.',
  'Ghi nhận tụ dịch vùng mổ. Chưa ghi nhận tụ máu vùng mổ.',
  'Dẫn lưu còn tại chỗ. Không ghi nhận dịch quanh đầu dẫn lưu.',
  'Định vị tổn thương trước mổ, dây định vị và clip đánh dấu.',
  'Khâu vết mổ, thay băng, cắt chỉ và kiểm tra vết thương.',
  'Gây mê, gây tê tại chỗ, hồi tỉnh và theo dõi sau phẫu thuật.'
 ],
 'Câu liên tục và chuyển ý':[
  'Vú phải mô tuyến không đồng nhất, chưa thấy tổn thương khu trú, chuyển sang vú trái.',
  'Vú trái vị trí hai giờ có nốt giảm âm, kích thước tám nhân sáu mi li mét, bờ rõ.',
  'Hạch nách phải còn rốn mỡ, hạch nách trái cũng còn rốn mỡ, chưa ghi nhận hạch bất thường.',
  'Vú phải có hai nốt, nốt một ở ba giờ, nốt hai ở chín giờ, mô tả từng nốt riêng.',
  'Tôi đọc lại số đo, mười ba nhân bảy mi li mét, không phải ba mươi nhân bảy.',
  'Chỗ này chưa rõ, để tôi khảo sát lại, hiện chưa ghi kết luận cho vùng này.',
  'Vùng sẹo mổ vú trái có ít dịch, không thấy cấu trúc đặc rõ trong vùng đang khảo sát.',
  'So với phim trước, vị trí không thay đổi, số đo cần đối chiếu lại trên cùng mặt cắt.',
  'Từ vú trái chuyển qua nách trái, sau đó kiểm tra lại nách phải.',
  'Kết thúc mô tả, bác sĩ sẽ kiểm tra lại bên tổn thương, đơn vị đo và phân loại đã đọc.'
 ],
 'Âm gần nhau và đọc nhanh':[
  'Bảy mi li mét, bảy mươi mi li mét; mười lăm mi li mét, năm mươi mi li mét.',
  'Mười ba, ba mươi; mười bốn, bốn mươi; mười bảy, bảy mươi.',
  'Nang đơn thuần, nang phức tạp, thành phần đặc và thành phần dịch.',
  'Tăng âm, giảm âm, trống âm; tăng tưới máu, không tăng tưới máu.',
  'Bờ rõ, bờ không rõ; đều, không đều; còn rốn mỡ, mất rốn mỡ.',
  'Hạch nách phải, hạch nách trái; vú phải, vú trái; bên phải, bên trái.',
  'Một giờ cách núm hai xen ti mét; hai giờ cách núm một xen ti mét.',
  'Không thấy khối đặc, không thấy giãn ống tuyến, không thấy hạch nách bất thường.',
  'Có một nốt, không có nốt thứ hai; có hai hạch, chưa thấy hạch thứ ba.',
  'Vú trái hai giờ nốt giảm âm tám nhân sáu, vú phải chưa thấy nốt, hai nách chưa thấy hạch bất thường.'
 ]
};
export const prompts=Object.entries(groups).flatMap(([category,texts],g)=>texts.map((text,i)=>({id:`VU-${String(g*10+i+1).padStart(3,'0')}`,category,text})));
export const columns=['id','audio','speaker_id','session_id','split','prompt_id','pace','condition','verbatim_text','reviewed','allowed_for_training'];
export function csv(rows,headers=columns){
 const field=value=>'"'+String(value??'').replaceAll('"','""')+'"';
 return '\ufeff'+[headers.map(field).join(','),...rows.map(row=>headers.map(key=>field(row[key])).join(','))].join('\r\n')+'\r\n';
}
export function sampleRow({prompt,speaker,session,split,pace,condition,text,id}){
 if(!/^[A-Z0-9_-]{2,40}$/i.test(speaker)||!/^[A-Z0-9_-]{2,40}$/i.test(session))throw Error('Dùng mã không dấu, 2–40 ký tự: BS01, BS01_BUOI01.');
 if(!['train','dev','test'].includes(split))throw Error('Nhóm dữ liệu không hợp lệ.');
 if(!text.trim())throw Error('Cần bản chép đúng lời thực tế.');
 return {id,audio:`audio/${id}.wav`,speaker_id:speaker,session_id:session,split,prompt_id:prompt.id,pace,condition,verbatim_text:text.trim(),reviewed:'yes',allowed_for_training:'yes'};
}
