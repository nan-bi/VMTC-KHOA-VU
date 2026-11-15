const pad = value => String(value).padStart(2,'0');
export function deviceStamp(date=new Date()) {
  if(!Number.isFinite(date.getTime()))throw Error('Đồng hồ thiết bị không hợp lệ.');
  const offsetMinutes=-date.getTimezoneOffset();
  return {iso:date.toISOString(),local:`${pad(date.getDate())}/${pad(date.getMonth()+1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,offsetMinutes,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone};
}
export function showTime(stamp) {
  if(!stamp)return 'Chưa ghi nhận';
  const offset=stamp.offsetMinutes;
  return `${stamp.local} (UTC${offset<0?'-':'+'}${pad(Math.floor(Math.abs(offset)/60))}:${pad(Math.abs(offset)%60)})`;
}
