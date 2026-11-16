// Store the inspected source manifest together with rows; never drop learned schemas.
export function commitImportState(state,preview,date=new Date().toLocaleString('vi-VN')){
 if(state.report||state.revision!==preview.baseRevision)throw Error('Dữ liệu đã thay đổi hoặc báo cáo đã khóa. Kiểm tra file lại trước khi lưu.');
 state.rows.push(...preview.rows);state.skippedDuplicates=(state.skippedDuplicates||0)+preview.duplicateCount;state.hashes.push(...preview.hashes);
 state.imports.unshift(...preview.files.map(file=>({...structuredClone(file),name:file.file,date})),...(preview.skippedSheets||[]).map(file=>({name:file.file+' · '+file.sheet,count:0,reason:file.reason,status:'CHUA_NHAP',date})));
 return state;
}
