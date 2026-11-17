// TEST-ONLY, read-only adapter. Never creates a client, runs SQL or writes to a database.
// The caller must provide a Supabase client connected to an independently verified TEST project.
const tables=Object.freeze({
  events:"fest_events",
  tasks:"fest_tasks",
  contacts:"fest_contacts",
  ecocups:"fest_ecocup_movements",
  recipes:"fest_recipes"
});
const columns=Object.freeze({
  events:"id,title,event_date,notes",
  tasks:"id,event_id,title,done,sort_order",
  contacts:"id,kind,name,email,phone,notes",
  ecocups:"id,kind,quantity,signed_delta,note,created_at",
  recipes:"id,title,reference_servings,ingredients,instructions,original_image_path"
});

export function createSharedReadAdapter(client,{testProjectConfirmed=false}={}){
  if(testProjectConfirmed!==true)throw new Error("Independent TEST Supabase project must be confirmed");
  if(!client||typeof client.from!=="function")throw new TypeError("Invalid Supabase client");
  return Object.freeze({
    async list(module,{limit=100}={}){
      if(!Object.hasOwn(tables,module))throw new RangeError("Unknown module");
      if(!Number.isInteger(limit)||limit<1||limit>500)throw new RangeError("Invalid page size");
      const {data,error}=await client.from(tables[module]).select(columns[module]).limit(limit);
      if(error)throw new Error("Shared read failed");
      if(!Array.isArray(data))throw new TypeError("Invalid shared response");
      return data;
    }
  });
}
