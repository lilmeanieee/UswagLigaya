// document-template-script.js  (v2 — add, update, delete all working)
const API = {
  TEMPLATES: '../../php-handlers/get-templates.php',
  CREATE:    '../../php-handlers/add-template.php',
  UPDATE:    '../../php-handlers/update-template.php'
};

let documentTypes = [];
const $   = s => document.querySelector(s);
const slug= s => s.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');

function showAlert(type,msg){
  const d=document.createElement('div');
  d.className=`alert alert-${type} alert-dismissible fade show`;
  d.innerHTML=`${msg}<button class="btn-close" data-bs-dismiss="alert"></button>`;
  $('.container').prepend(d);
  setTimeout(()=>bootstrap.Alert.getOrCreateInstance(d).close(),3e3);
}

/* ---------- CRUD ---------- */
function fetchDocumentTemplates(){
  fetch(API.TEMPLATES).then(r=>r.json()).then(a=>{
    documentTypes=(a||[]).filter(t=>!t.is_archived).map(t=>({...t,id:+t.id}));
    populateTable();
  });
}

function collectFields(containerSel){
  const out=[];
  $(containerSel).querySelectorAll('.custom-field').forEach(div=>{
    const lbl=div.querySelector('input[type="text"]').value.trim();
    if(lbl) out.push({
      field_key: slug(lbl),
      label: lbl,
      is_required: div.querySelector('input[type="checkbox"]').checked
    });
  });
  return out;
}

/* ---- Add */
function saveDocumentType(){
  const name=$('#documentName').value.trim();
  if(!name) return alert('Name required');
  const fd=new FormData();
  fd.append('name',name);
  fd.append('description',$('#documentDescription').value.trim());
  fd.append('fee',parseFloat($('#documentFee').value)||0);
  fd.append('fields',JSON.stringify(collectFields('#editAdditionalFields')));
  const f=$('#addTemplateFile').files[0]; if(f) fd.append('template_file',f);

  fetch(API.CREATE,{method:'POST',body:fd})
    .then(r=>r.json())
    .then(j=>{
      if(j.success){
        showAlert('success',`“${name}” saved`);
        bootstrap.Modal.getInstance($('#addDocumentModal')).hide();
        $('#addDocumentForm').reset();
        $('#editAdditionalFields').innerHTML='';
        fetchDocumentTemplates();
      }else showAlert('danger',j.error||'Server error');
    });
}

/* ---- Update (archive‑and‑insert) */
function updateDocumentType(){
    const id=+$('#editDocumentId').value;
    const name=$('#editDocumentName').value.trim();
    if(!name) return alert('Name required');
    const fd=new FormData();
    fd.append('action','update');
    fd.append('id',id);
    fd.append('name',name);
    fd.append('description',$('#editDocumentDescription').value.trim());
    fd.append('fee',parseFloat($('#editDocumentFee').value)||0);
    fd.append('fields',JSON.stringify(collectFields('#additionalFields')));
    const f = $('#editTemplateFile').files[0];
    if (f) fd.append('template_file', f); 

  fetch(API.UPDATE,{method:'POST',body:fd})
    .then(r=>r.json())
    .then(j=>{
      if(j.success){
        showAlert('success','Template updated');
        bootstrap.Modal.getInstance($('#editDocumentModal')).hide();
        fetchDocumentTemplates();
      }else showAlert('danger',j.error||'Update failed');
    });
}

/* ---- Archive */
function deleteDocumentType(id){
  const doc=documentTypes.find(d=>d.id===id); if(!doc) return;
  const fd=new FormData(); fd.append('id',id); fd.append('is_archived',1);
  fetch(API.UPDATE,{method:'POST',body:fd})
    .then(r=>r.json())
    .then(j=>{
      if(j.success){
        showAlert('danger',`“${doc.name}” archived`);
        bootstrap.Modal.getInstance($('#deleteConfirmModal')).hide();
        fetchDocumentTemplates();
      }else showAlert('danger',j.error||'Archive failed');
    });
}

/* ---------- Modals ---------- */
window.openEditModal=id=>{
  const t=documentTypes.find(x=>x.id===id); if(!t) return;
  $('#editDocumentId').value=t.id;
  $('#editDocumentName').value=t.name;
  $('#editDocumentDescription').value=t.description;
  $('#editDocumentFee').value=t.fee;
  $('#editFileHint').textContent=t.file_name||'No file';

  const cont=$('#additionalFields'); cont.innerHTML='';
  (t.customFields||[]).forEach(f=>{
    const div=document.createElement('div');
    div.className='custom-field d-flex align-items-center mb-2';
    div.innerHTML=`<input type="text" class="form-control me-2" value="${f.label}" required>
                   <div class="form-check form-switch me-2">
                     <input class="form-check-input" type="checkbox" ${f.is_required?'checked':''}>
                   </div>
                   <button class="btn btn-outline-danger btn-sm"><i class="bi bi-x"></i></button>`;
    div.querySelector('button').onclick=()=>div.remove();
    cont.appendChild(div);
  });
  bootstrap.Modal.getOrCreateInstance($('#editDocumentModal')).show();
};

function openDeleteModal(id){
  $('#deleteDocumentName').textContent=(documentTypes.find(d=>d.id===id)||{}).name||'';
  $('#confirmDeleteBtn').dataset.id=id;
  bootstrap.Modal.getOrCreateInstance($('#deleteConfirmModal')).show();
}

/* ---------- Table & Field Helpers ---------- */
function addCustomField(mode){
  const container=mode==='add'?$('#editAdditionalFields'):$('#additionalFields');
  const div=document.createElement('div');
  div.className='custom-field d-flex align-items-center mb-2';
  div.innerHTML = `<input type="text" class="form-control me-2" placeholder="Field Name" required>
                 <div class="form-check form-switch me-2">
                   <input class="form-check-input" type="checkbox" checked>
                 </div>
                 <button class="btn btn-outline-danger btn-sm"><i class="bi bi-x"></i></button>`;
  div.querySelector('button').onclick=()=>div.remove();
  container.appendChild(div);
}

function populateTable(templatesToDisplay = documentTypes){
  const tb=$('#documentTypesTable tbody'); tb.innerHTML='';
  templatesToDisplay.forEach(t=>{
    const badges=(t.customFields||[]).map(f=>
      `<span class="badge me-1 ${f.is_required?'bg-primary':'bg-secondary'}">
         ${f.label}<small>(${f.is_required?'Req':'Opt'})</small>
       </span>`).join('');
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><strong>${t.name}</strong></td>
                  <td>${t.description}</td>
                  <td>${t.fee?`₱${t.fee.toFixed(2)}`:'<span class="text-success">Free</span>'}</td>
                  <td>${badges}</td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary edit-btn"  data-id="${t.id}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger  delete-btn" data-id="${t.id}"><i class="bi bi-trash"></i></button>
                  </td>`;
    tb.appendChild(tr);
  });
  tb.querySelectorAll('.edit-btn').forEach(b=>b.onclick=()=>openEditModal(+b.dataset.id));
  tb.querySelectorAll('.delete-btn').forEach(b=>b.onclick=()=>openDeleteModal(+b.dataset.id));
}



/* ---------- Search ---------- */
function handleSearch(e) {
  const q = e.target.value.trim().toLowerCase();

  if (!q) {                   // empty box → show all
    populateTable();
    return;
  }

  // match only against the template name
  const filtered = documentTypes.filter(t =>
    t.name.toLowerCase().includes(q)
  );

  populateTable(filtered);
}


/* ---------- DOM Ready ---------- */
document.addEventListener('DOMContentLoaded',()=>{
  fetchDocumentTemplates();
  $('#editAddFieldBtn').onclick=()=>addCustomField('add');   // in Add modal
  $('#addFieldBtn').onclick    =()=>addCustomField('edit');  // in Edit modal
  $('#saveDocumentBtn').onclick   = saveDocumentType;
  $('#updateDocumentBtn').onclick = updateDocumentType;
  $('#confirmDeleteBtn').onclick  = ()=>deleteDocumentType(+$('#confirmDeleteBtn').dataset.id);
  $('#templateSearch').addEventListener('input', handleSearch);
});