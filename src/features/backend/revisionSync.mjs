// Polling unchanged revisions must not replace live editor/analysis inputs.
export function revisionSync(workspaceRevision,reviewRevision){
 return (workspace,reviews)=>{
  const changed={workspace:workspace.revision!==workspaceRevision,reviews:reviews.revision!==reviewRevision};
  workspaceRevision=workspace.revision;reviewRevision=reviews.revision;
  return changed;
 };
}
