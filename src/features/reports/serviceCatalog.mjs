export function extendCatalog(base,config={}){
 const additions=config?.additionalServices||[];
 if(!Array.isArray(additions)||additions.length>5000)throw Error('Danh mục bổ sung tối đa5.000 dịch vụ.');
 const codes=new Set(base.map(r=>r.code));
 for(const item of additions){if(!item||['code','name','group'].some(key=>typeof item[key]!=='string'||!item[key].trim()||item[key].length>300)||codes.has(item.code))throw Error('Dịch vụ bổ sung cần mã, tên, nhóm và không trùng mã danh mục.');codes.add(item.code);}
 return [...base,...additions];
}
