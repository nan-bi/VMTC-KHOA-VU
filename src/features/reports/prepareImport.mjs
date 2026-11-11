import {ingestFiles} from '../intelligence/ingestion.mjs';
import {normalizeIncomingRows} from './importRows.mjs';
import {validate} from './core.mjs';
export async function prepareReportImport(files,state,catalog){
 const loaded=await ingestFiles(files),seen=new Set(state.hashes),skippedFiles=[],accepted=[];
 for(const file of loaded.files){if(seen.has(file.hash)){skippedFiles.push(file);continue;}seen.add(file.hash);accepted.push(file);}
 const acceptedHashes=new Set(accepted.map(f=>f.hash));
 // The same bytes may have been selected under different names; keep one physical source.
 const incoming=accepted.flatMap(file=>loaded.rows.filter(r=>r.source_file_hash===file.hash&&r.source_file===file.file).slice(0,file.count));
 const rows=incoming.map(r=>({...normalizeIncomingRows([r],r.source_file)[0],source_row:r.source_row,source_sheet:r.source_sheet,source_file_hash:r.source_file_hash}));
 const checked=validate([...state.rows,...rows],catalog),offset=state.rows.length;
 const duplicates=checked.duplicates.filter(d=>d.index>=offset),skip=new Set(duplicates.map(d=>d.index-offset));
 const retained=rows.filter((_,i)=>!skip.has(i));
 return {rows:retained,files:accepted,skippedFiles,hashes:[...acceptedHashes],duplicateCount:duplicates.length,readCount:loaded.rows.length,issues:checked.issues.filter(e=>e.index>=offset),existingConflicts:checked.issues.filter(e=>e.index<offset),baseRevision:state.revision};
}
