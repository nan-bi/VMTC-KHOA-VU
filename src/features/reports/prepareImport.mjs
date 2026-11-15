import {ingestFiles} from '../intelligence/ingestion.mjs';
import {pythonTask} from '../backend/pythonClient.mjs';
export async function prepareReportImport(files,state,catalog){
 const loaded=await ingestFiles(files,{folder:files.length>10||files.some(f=>!!f.webkitRelativePath)});
 return pythonTask('prepare-import',{loaded,state,catalog});
}
