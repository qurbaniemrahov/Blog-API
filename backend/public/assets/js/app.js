const CONFIG = { apiBase: '', perPage: 5 };

const seed = {
  users: [
    {id:1,name:'Aylin Səfər',email:'aylin@northstar.az',role:'Admin',active:true},{id:2,name:'Murad Əliyev',email:'murad@northstar.az',role:'Redaktor',active:true},{id:3,name:'Leyla Məmmədli',email:'leyla@northstar.az',role:'Müəllif',active:true},{id:4,name:'Elvin Qasımov',email:'elvin@northstar.az',role:'Müəllif',active:false},{id:5,name:'Nərgiz Hüseyn',email:'nergiz@northstar.az',role:'Redaktor',active:true},{id:6,name:'Tural Rzayev',email:'tural@northstar.az',role:'Müəllif',active:true}
  ],
  categories: [
    {id:1,name:'Texnologiya',slug:'texnologiya',description:'Rəqəmsal dünya və innovasiyalar'},{id:2,name:'Dizayn',slug:'dizayn',description:'Məhsul və vizual dizayn'},{id:3,name:'Biznes',slug:'biznes',description:'Sahibkarlıq və strategiya'},{id:4,name:'Həyat tərzi',slug:'heyat-terzi',description:'Gündəlik həyat və inkişaf'},{id:5,name:'Mədəniyyət',slug:'medeniyyet',description:'İncəsənət və cəmiyyət'}
  ],
  posts: [
    {id:1,title:'Süni intellekt iş dünyasını necə dəyişir?',excerpt:'Yeni alətlər və gələcəyin iş mühiti haqqında baxış.',content:'Süni intellekt artıq iş proseslərinin ayrılmaz hissəsinə çevrilir.',userId:1,categoryId:1,status:'published',createdAt:'2026-09-11'},
    {id:2,title:'Yaxşı dizayn görünəndən daha artıqdır',excerpt:'Funksiya və estetika arasındakı incə balans.',content:'Dizayn problemi həll etmək üçün düşünülmüş bir prosesdir.',userId:3,categoryId:2,status:'published',createdAt:'2026-09-10'},
    {id:3,title:'Kiçik komandalar üçün böyük strategiya',excerpt:'Məhdud resurslarla daha yaxşı nəticələr.',content:'Fokus kiçik komandanın ən güclü üstünlüyüdür.',userId:2,categoryId:3,status:'draft',createdAt:'2026-09-09'},
    {id:4,title:'Səhər rutininizi yenidən qurun',excerpt:'Daha aydın və məhsuldar gün üçün sadə addımlar.',content:'Günün ilk saatı qalan hissənin ritmini müəyyən edir.',userId:5,categoryId:4,status:'published',createdAt:'2026-09-07'},
    {id:5,title:'Bakının yaradıcı məkanları',excerpt:'Şəhərin yaradıcı ruhunu yaşadan ünvanlar.',content:'Bakının yaradıcı səhnəsi hər il daha da zənginləşir.',userId:3,categoryId:5,status:'published',createdAt:'2026-09-06'},
    {id:6,title:'2027 üçün məhsul trendləri',excerpt:'Məhsul komandalarını gözləyən əsas dəyişikliklər.',content:'Sadəlik və fərdiləşdirmə yeni məhsulların mərkəzindədir.',userId:1,categoryId:1,status:'draft',createdAt:'2026-09-04'},
    {id:7,title:'Brend dilini necə yaratmalı?',excerpt:'Ardıcıl ünsiyyət üçün praktik çərçivə.',content:'Güclü brend dili aydın prinsiplər üzərində qurulur.',userId:2,categoryId:2,status:'published',createdAt:'2026-09-02'}
  ]
};

const clone = x => JSON.parse(JSON.stringify(x));
const saved = JSON.parse(localStorage.getItem('northstar_data') || 'null');
const state = { data: saved || clone(seed), view: location.hash.slice(1) || 'dashboard', page: 1, query: '', category: 'all' };
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const initials = name => name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
const persist = () => localStorage.setItem('northstar_data', JSON.stringify(state.data));
const getUser = id => state.data.users.find(x => x.id == id);
const getCategory = id => state.data.categories.find(x => x.id == id);
const formatDate = d => new Intl.DateTimeFormat('az-AZ',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(d));

function toast(message, error=false){const el=document.createElement('div');el.className=`toast ${error?'error':''}`;el.textContent=message;$('#toastStack').append(el);setTimeout(()=>el.remove(),2800)}

async function api(resource, method='GET', body){
  try{
    const url = CONFIG.apiBase ? `${CONFIG.apiBase.replace(/\/$/,'')}/${resource}` : `/${resource}`;
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    const res = await fetch(url,{method,headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-TOKEN':csrfToken},body:body?JSON.stringify(body):undefined});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.status===204?null:await res.json();
  }catch(e){toast(`API xətası: ${e.message}. Demo məlumatı istifadə edildi.`,true);return null}
}

async function hydrateFromApi(){
  if(!CONFIG.apiBase) return;
  const results = await Promise.all(['posts','users','categories'].map(resource=>api(resource)));
  ['posts','users','categories'].forEach((resource,index)=>{
    const payload=results[index];
    const records=Array.isArray(payload)?payload:(Array.isArray(payload?.data)?payload.data:null);
    if(records) state.data[resource]=records;
  });
  persist();render();
}

function pageHead(title, desc, eyebrow='CONTENT OVERVIEW'){
  return `<div class="page-head"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${desc}</p></div><span class="date-badge">◷ &nbsp; ${new Intl.DateTimeFormat('az-AZ',{day:'numeric',month:'long',year:'numeric'}).format(new Date())}</span></div>`;
}

function dashboard(){
  const published=state.data.posts.filter(p=>p.status==='published').length;
  const counts=state.data.categories.map(c=>({...c,count:state.data.posts.filter(p=>p.categoryId==c.id).length})).sort((a,b)=>b.count-a.count);
  return `${pageHead('Sabahın xeyir, Aylin.','Məzmun ekosistemində bu gün nələr baş verir.')}
  <div class="stats">
    ${stat('Yazıların sayı',state.data.posts.length,'↑ 12% bu ay','▤')}${stat('Yayımlanmış',published,'↑ 8% bu ay','✓')}${stat('İstifadəçilər',state.data.users.length,'↑ 2 yeni üzv','○')}${stat('Kateqoriyalar',state.data.categories.length,'Stabil göstərici','◇',true)}
  </div>
  <div class="dashboard-grid">
    <section class="panel"><div class="panel-head"><h2>Kontent performansı</h2><button class="text-btn">Son 7 gün⌄</button></div><div class="chart-wrap"><div class="y-axis"><span>120</span><span>90</span><span>60</span><span>30</span><span>0</span></div><div class="chart"><div class="bars">${[['B.e',52,33],['Ç.a',68,41],['Ç',45,29],['C.a',77,48],['C',61,40],['Ş',89,58],['B',72,51]].map(x=>`<div class="bar-group"><i class="bar" style="height:${x[1]}%"></i><i class="bar alt" style="height:${x[2]}%"></i><span class="bar-label">${x[0]}</span></div>`).join('')}</div></div></div><div class="chart-legend"><span><i></i>Baxışlar</span><span><i></i>Oxucular</span></div></section>
    <section class="panel"><div class="panel-head"><h2>Kateqoriyalar</h2><button class="text-btn" data-view="categories">Hamısı →</button></div><div class="category-list">${counts.slice(0,5).map((c,i)=>`<div class="category-row"><span class="cat-symbol">${['⌁','✦','↗','◌','◎'][i]}</span><div><b>${esc(c.name)}</b><small>${c.count} yazı</small><div class="cat-bar"><i style="width:${Math.max(14,c.count/(counts[0]?.count||1)*100)}%"></i></div></div><span>${String(c.count).padStart(2,'0')}</span></div>`).join('')}</div></section>
  </div>${postsTable('Son yazılar',state.data.posts.slice(0,5),false)}`;
}

function stat(label,value,trend,icon,neutral=false){return `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${String(value).padStart(2,'0')}</div><span class="trend ${neutral?'neutral':''}">${trend}</span></article>`}

function postsView(){
  let list=state.data.posts.filter(p=>`${p.title} ${p.excerpt}`.toLowerCase().includes(state.query.toLowerCase())&&(state.category==='all'||p.categoryId==state.category));
  const pages=Math.max(1,Math.ceil(list.length/CONFIG.perPage));state.page=Math.min(state.page,pages);const start=(state.page-1)*CONFIG.perPage;const rows=list.slice(start,start+CONFIG.perPage);
  return `${pageHead('Yazılar','Bütün məzmunu yaradın, redaktə edin və idarə edin.','CONTENT LIBRARY')}<section class="panel table-panel"><div class="panel-head"><h2>Bütün yazılar <small>(${list.length})</small></h2><button class="primary-btn" data-action="new-post">＋ Yeni yazı</button></div><div class="toolbar"><label class="search-box">⌕<input id="listSearch" value="${esc(state.query)}" placeholder="Yazılarda axtar..." /></label><select class="filter-select" id="categoryFilter"><option value="all">Bütün kateqoriyalar</option>${state.data.categories.map(c=>`<option value="${c.id}" ${state.category==c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div>${postsTable('',rows,true,list.length,start,pages)}</section>`;
}

function postsTable(title,rows,full,total=rows.length,start=0,pages=1){return `<section class="${title?'panel table-panel':''}">${title?`<div class="panel-head"><h2>${title}</h2><button class="text-btn" data-view="posts">Hamısına bax →</button></div>`:''}${rows.length?`<table class="data-table"><thead><tr><th>Yazı</th><th>Kateqoriya</th><th>Müəllif</th><th>Status</th><th>Tarix</th><th></th></tr></thead><tbody>${rows.map(p=>`<tr><td><div class="title-cell"><span class="post-thumb">${['✦','⌁','◌'][p.id%3]}</span><div><b>${esc(p.title)}</b><small>#${String(p.id).padStart(3,'0')}</small></div></div></td><td>${esc(getCategory(p.categoryId)?.name||'—')}</td><td>${esc(getUser(p.userId)?.name||'—')}</td><td><span class="status ${p.status==='draft'?'draft':''}">${p.status==='published'?'Yayımlanıb':'Qaralama'}</span></td><td>${formatDate(p.createdAt)}</td><td><div class="actions"><button data-edit="post" data-id="${p.id}" title="Redaktə">✎</button><button data-delete="post" data-id="${p.id}" title="Sil">⌫</button></div></td></tr>`).join('')}</tbody></table>`:`<div class="empty"><b>Nəticə tapılmadı</b>Axtarış şərtlərini dəyişin və yenidən yoxlayın.</div>`}${full?`<div class="table-footer"><span>${total?`${start+1}–${Math.min(start+CONFIG.perPage,total)} / ${total}`:'0 nəticə'}</span><div class="pagination"><button data-page="${state.page-1}" ${state.page===1?'disabled':''}>‹</button>${Array.from({length:pages},(_,i)=>`<button data-page="${i+1}" class="${state.page===i+1?'active':''}">${i+1}</button>`).join('')}<button data-page="${state.page+1}" ${state.page===pages?'disabled':''}>›</button></div></div>`:''}</section>`}

function usersView(){return `${pageHead('İstifadəçilər','Komandanızı və onların rollarını idarə edin.','TEAM DIRECTORY')}<div class="panel-head"><h2>Komanda üzvləri (${state.data.users.length})</h2><button class="primary-btn" data-action="new-user">＋ Yeni istifadəçi</button></div><div class="card-grid">${state.data.users.map(u=>`<article class="entity-card"><div class="entity-top"><span class="entity-avatar">${initials(u.name)}</span><div><h3>${esc(u.name)}</h3><p>${esc(u.email)}</p></div><div class="actions"><button data-edit="user" data-id="${u.id}">✎</button><button data-delete="user" data-id="${u.id}">⌫</button></div></div><div class="entity-meta"><span>${esc(u.role)}</span><span class="status ${u.active?'':'inactive'}">${u.active?'Aktiv':'Deaktiv'}</span></div></article>`).join('')}</div>`}

function categoriesView(){const cats=state.data.categories;return `${pageHead('Kateqoriyalar','Məzmunu oxucular üçün səliqəli qruplaşdırın.','CONTENT TAXONOMY')}<div class="panel-head"><h2>Bütün kateqoriyalar (${cats.length})</h2><button class="primary-btn" data-action="new-category">＋ Yeni kateqoriya</button></div><div class="card-grid">${cats.map(c=>`<article class="entity-card"><div class="entity-top"><span class="entity-avatar">${c.name[0]}</span><div><h3>${esc(c.name)}</h3><p>/${esc(c.slug)}</p></div><div class="actions"><button data-edit="category" data-id="${c.id}">✎</button><button data-delete="category" data-id="${c.id}">⌫</button></div></div><p style="color:var(--muted);font-size:11px;min-height:28px;margin:18px 0">${esc(c.description||'Açıqlama əlavə edilməyib')}</p><div class="entity-meta"><span>Yazıların sayı</span><b>${state.data.posts.filter(p=>p.categoryId==c.id).length}</b></div></article>`).join('')}</div>`}

function render(){
  $$('.nav-link[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===state.view));
  $('#postNavCount').textContent=state.data.posts.length;
  $('#appContent').innerHTML=state.view==='posts'?postsView():state.view==='users'?usersView():state.view==='categories'?categoriesView():dashboard();
  $('#sidebar').classList.remove('open'); bindDynamic();
}

function bindDynamic(){
  $('#listSearch')?.addEventListener('input',e=>{state.query=e.target.value;state.page=1;render()});
  $('#categoryFilter')?.addEventListener('change',e=>{state.category=e.target.value;state.page=1;render()});
  $$('[data-page]').forEach(b=>b.onclick=()=>{state.page=+b.dataset.page;render()});
  $$('[data-view]').forEach(b=>b.onclick=e=>{e.preventDefault();navigate(b.dataset.view)});
  $$('[data-action]').forEach(b=>b.onclick=()=>handleAction(b.dataset.action));
  $$('[data-edit]').forEach(b=>b.onclick=()=>openForm(b.dataset.edit,+b.dataset.id));
  $$('[data-delete]').forEach(b=>b.onclick=()=>removeEntity(b.dataset.delete,+b.dataset.id));
}

function navigate(view){state.view=view;state.page=1;location.hash=view;render()}
function handleAction(action){if(action==='new-post')openForm('post');if(action==='new-user')openForm('user');if(action==='new-category')openForm('category');if(action==='close-modal')closeModal();if(action==='settings')openSettings()}

function openForm(type,id){
  const plural={post:'posts',user:'users',category:'categories'}[type];const item=id?state.data[plural].find(x=>x.id===id):{};
  const label={post:'yazı',user:'istifadəçi',category:'kateqoriya'}[type];$('#modalEyebrow').textContent=type==='post'?'CONTENT EDITOR':type==='user'?'TEAM MEMBER':'TAXONOMY';$('#modalTitle').textContent=id?`${label[0].toUpperCase()+label.slice(1)} redaktəsi`:`Yeni ${label}`;
  $('#entityForm').dataset.type=type;$('#entityForm').dataset.id=id||'';
  $('#entityForm').innerHTML=`<div class="form-body">${type==='post'?postFields(item):type==='user'?userFields(item):categoryFields(item)}<div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Ləğv et</button><button class="primary-btn" type="submit">${id?'Dəyişiklikləri saxla':'Əlavə et'}</button></div></div>`;
  $('#modalBackdrop').hidden=false;document.body.style.overflow='hidden';bindDynamic();$('#entityForm').onsubmit=saveEntity;
}
function postFields(p){return `<div class="field full"><label>Başlıq *</label><input name="title" required value="${esc(p.title||'')}" placeholder="Yazının başlığı" /></div><div class="field"><label>Müəllif *</label><select name="userId" required>${state.data.users.map(u=>`<option value="${u.id}" ${p.userId==u.id?'selected':''}>${esc(u.name)}</option>`).join('')}</select></div><div class="field"><label>Kateqoriya *</label><select name="categoryId" required>${state.data.categories.map(c=>`<option value="${c.id}" ${p.categoryId==c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div class="field full"><label>Qısa təsvir</label><input name="excerpt" value="${esc(p.excerpt||'')}" placeholder="Bir cümləlik xülasə" /></div><div class="field full"><label>Məzmun *</label><textarea name="content" required placeholder="Məzmunu yazın...">${esc(p.content||'')}</textarea></div><div class="field"><label>Status</label><select name="status"><option value="draft" ${p.status==='draft'?'selected':''}>Qaralama</option><option value="published" ${p.status==='published'?'selected':''}>Yayımla</option></select></div>`}
function userFields(u) {
  return `
    <div class="field full">
      <label>Ad və soyad *</label>
      <input name="name" required value="${esc(u.name || '')}" />
    </div>

    <div class="field full">
      <label>E-poçt *</label>
      <input type="email" name="email" required value="${esc(u.email || '')}" />
    </div>

    <div class="field">
      <label>Rol</label>
      <select name="role">
        <option value="admin">Admin</option>
        <option value="redaktor">Redaktor</option>
        <option value="author">Müəllif</option>
      </select>
    </div>

    <div class="field">
      <label>Status</label>
      <select name="status">
        <option value="active">Aktiv</option>
        <option value="inactive">Deaktiv</option>
      </select>
    </div>
  `;
}
function categoryFields(c){return `<div class="field full"><label>Kateqoriya adı *</label><input name="name" required value="${esc(c.name||'')}" /></div><div class="field full"><label>Slug *</label><input name="slug" required value="${esc(c.slug||'')}" placeholder="meselen-kateqoriya" /></div><div class="field full"><label>Açıqlama</label><textarea name="description">${esc(c.description||'')}</textarea></div>`}

async function saveEntity(e){
  e.preventDefault();const type=e.currentTarget.dataset.type,id=+e.currentTarget.dataset.id;const plural={post:'posts',user:'users',category:'categories'}[type];const data=Object.fromEntries(new FormData(e.currentTarget));
  if(type==='post'){data.userId=+data.userId;data.categoryId=+data.categoryId;data.createdAt=id?(state.data.posts.find(x=>x.id===id).createdAt):new Date().toISOString().slice(0,10)}
  if(id){const idx=state.data[plural].findIndex(x=>x.id===id);state.data[plural][idx]={...state.data[plural][idx],...data};await api(`${plural}/${id}`,'PUT',data)}else{data.id=Math.max(0,...state.data[plural].map(x=>x.id))+1;state.data[plural].unshift(data);await api(plural,'POST',data)}
  persist();closeModal();render();toast(id?'Dəyişikliklər yadda saxlanıldı.':'Yeni məlumat uğurla əlavə edildi.');
}

async function removeEntity(type,id){
  const plural={post:'posts',user:'users',category:'categories'}[type];const label={post:'yazını',user:'istifadəçini',category:'kateqoriyanı'}[type];
  if(!confirm(`Bu ${label} silmək istədiyinizə əminsiniz?`))return;
  if(type==='category'&&state.data.posts.some(p=>p.categoryId===id)){toast('Bu kateqoriyaya aid yazılar var. Əvvəlcə onları köçürün.',true);return}
  if(type==='user'&&state.data.posts.some(p=>p.userId===id)){toast('Bu istifadəçinin yazıları var. Əvvəlcə müəllifi dəyişin.',true);return}
  state.data[plural]=state.data[plural].filter(x=>x.id!==id);persist();await api(`${plural}/${id}`,'DELETE');render();toast('Məlumat silindi.');
}

function openSettings(){
  $('#modalEyebrow').textContent='SYSTEM';$('#modalTitle').textContent='API ayarları';$('#entityForm').dataset.type='settings';$('#entityForm').innerHTML=`<div class="form-body"><div class="field full"><label>REST API baza ünvanı</label><input name="apiBase" value="${esc(CONFIG.apiBase)}" placeholder="http://localhost:8000/api" /><small style="color:var(--muted)">Boş saxlasanız, tətbiq demo rejimində localStorage istifadə edəcək.</small></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Ləğv et</button><button class="primary-btn">Yadda saxla</button></div></div>`;$('#modalBackdrop').hidden=false;document.body.style.overflow='hidden';bindDynamic();$('#entityForm').onsubmit=e=>{e.preventDefault();CONFIG.apiBase=new FormData(e.currentTarget).get('apiBase').trim();localStorage.setItem('northstar_api',CONFIG.apiBase);$('#apiStatus').textContent=CONFIG.apiBase?'REST API aktivdir':'Demo rejimi';closeModal();toast('API ayarları yadda saxlanıldı.')}
}
function closeModal(){$('#modalBackdrop').hidden=true;document.body.style.overflow=''}

document.addEventListener('click',e=>{if(e.target===$('#modalBackdrop'))closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#globalSearch').focus()}});
$('#menuToggle').onclick=()=>$('#sidebar').classList.toggle('open');
$('#globalSearch').addEventListener('input',e=>{state.query=e.target.value;if(state.view!=='posts')navigate('posts');else render()});
window.addEventListener('hashchange',()=>{state.view=location.hash.slice(1)||'dashboard';render()});
$('#apiStatus').textContent=CONFIG.apiBase?'REST API aktivdir':'Demo rejimi';render();
hydrateFromApi();
