let enabled=false,session=null,cache=null,reviews=null;
export const isBackend=()=>enabled;
export const backendUser=()=>session?.user||null;
export const backendRole=()=>({admin:'Nhập / đối soát',editor:'Nhập / đối soát',reviewer:'Người duyệt',viewer:'Chỉ xem'})[session?.user?.role]||'Nhập / đối soát';
export const backendState=()=>cache?structuredClone(cache):null;
export const backendReviews=()=>reviews?structuredClone(reviews):{version:1,revision:0,items:{}};
export async function request(path,options={}){
 const response=await fetch(path,{...options,credentials:'same-origin',headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(session?{'X-CSRF-Token':session.csrf}:{}),...options.headers}});
 const data=await response.json();if(!response.ok)throw Error(data.error||`HTTP ${response.status}`);return data;
}
export async function detectBackend(){
 const response=await fetch('/api/health',{cache:'no-store'});if(response.status===404)return null;if(!response.ok)throw Error('Máy chủ chưa sẵn sàng. Vui lòng tải lại.');if(!(response.headers.get('content-type')||'').includes('application/json'))return null;const data=await response.json();if(data.service!=='vinmec-internal-backend')throw Error('Không xác định được chế độ dữ liệu.');enabled=true;return data;
}
export async function restoreSession(){session=await request('/api/auth/session');await Promise.all([loadWorkspace(),loadReviews()]);return session;}
export async function login(username,password){session=await request('/api/auth/login',{method:'POST',body:JSON.stringify({username,password})});await Promise.all([loadWorkspace(),loadReviews()]);return session;}
export async function logout(){await request('/api/auth/logout',{method:'POST',body:'{}'});session=null;cache=null;location.reload();}
export async function loadWorkspace(){const next=await request('/api/workspace');if(!cache||next.revision>=cache.revision)cache=next;return structuredClone(cache);}
export async function loadReviews(){const next=await request('/api/reviews');if(!reviews||next.revision>=reviews.revision)reviews=next;return backendReviews();}
export async function saveBackendReview(expectedRevision,key,value){reviews=await request('/api/reviews',{method:'PUT',body:JSON.stringify({expectedRevision,key,value})});return backendReviews();}
export async function saveWorkspace(expectedRevision,mutate){
 const current=await loadWorkspace();if(current.revision!==expectedRevision)throw Error('Dữ liệu đã thay đổi ở phiên khác. Tải lại trước khi lưu.');
 const next=mutate(structuredClone(current));
 cache=await request('/api/workspace',{method:'PUT',body:JSON.stringify({expectedRevision,state:next})});return structuredClone(cache);
}
