import {createBrowserSpeechStore} from './browser-storage.mjs';
export {completedRecord,reviewedRecord,hasDraftContent,draftSnapshot} from './records.mjs';
const store=createBrowserSpeechStore();
export const listResults=()=>store.listResults();
export const listDrafts=()=>store.listDrafts();
export const saveDraft=(identity,state)=>store.saveDraft(identity,state);
export const restoreDraft=(id,owner)=>store.restoreDraft(id,owner);
export const saveCompletedResult=(record,draft)=>store.saveCompletedResult(record,draft);
export const saveReviewedResult=(id,revision,review)=>store.saveReviewedResult(id,revision,review);
