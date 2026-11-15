// Starting an operational workspace never inserts example service records.
export function emptyWorkspace(){return {version:1,revision:0,rows:[],imports:[],hashes:[],excluded:[],report:null,logs:[{time:new Date().toISOString(),action:'Khởi tạo kho dữ liệu vận hành.'}]};}
export function initialDateRange(rows=[],today=new Date().toLocaleDateString('sv-SE')){const dates=rows.map(r=>String(r.completed_at||r.ordered_at||'').slice(0,10)).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&d<=today).sort();const date=dates.at(-1)||today;return [date,date];}
