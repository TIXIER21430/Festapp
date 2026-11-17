// Read-only role overview for one event. No staffing requirements are inferred.
export function volunteerPostSummary(rows,eventId,posts=[]){
 const selected=(Array.isArray(rows)?rows:[]).filter(r=>r&&r.eventId===eventId&&Array.isArray(r.values));
 const result=posts.map(post=>({post,count:0}));
 const byPost=new Map(result.map(x=>[x.post,x]));
 let other=0,unassigned=0;
 for(const row of selected){
  const post=String(row.values[2]||"").trim();
  if(!post){unassigned++;continue;}
  const item=byPost.get(post);
  if(item)item.count++;
  else other++;
 }
 return {posts:result,other,unassigned,total:selected.length};
}
