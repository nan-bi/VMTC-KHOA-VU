import {ingestFiles} from '../intelligence/ingestion.mjs';
import {pythonTask} from '../backend/pythonClient.mjs';
export async function prepareReportImport(files,state,catalog,columnMappings=[]){
 const learned=[...new Map((state.imports||[]).flatMap(file=>(file.columnMappings||[]).map(profile=>({...profile,learned:true}))).map(profile=>[JSON.stringify([profile.columns.slice().sort(),profile.mapping]),profile])).values()];
 const loaded=await ingestFiles(files,{columnMappings:[...learned,...columnMappings],folder:files.length>10||files.some(f=>!!f.webkitRelativePath)});
 return pythonTask('prepare-import',{loaded,state,catalog});
}
