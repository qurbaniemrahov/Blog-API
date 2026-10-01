const CONFIG = { apiBase: localStorage.getItem('northstar_api') || '/api', perPage: 5 };
const state = { user: null, users: [], categories: [], posts: [], view: location.hash.slice(1) || 'dashboard', page: 1, query: '', category: 'all' };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const initials = name => name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
const formatDate = date => new Intl.DateTimeFormat('az-AZ', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));
const getUser = id => state.users.find(user => user.id == id);
const getCategory = id => state.categories.find(category => category.id == id);

function toast(message, error = false) {
  const element = document.createElement('div');
  element.className = `toast ${error ? 'error' : ''}`;
  element.textContent = message;
  $('#toastStack').append(element);
  setTimeout(() => element.remove(), 3500);
}

async function api(resource, method = 'GET', body = null) {
  const token = localStorage.getItem('northstar_token');
  const response = await fetch(`${CONFIG.apiBase.replace(/\/$/, '')}/${resource}`, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const validationMessage = payload?.errors ? Object.values(payload.errors).flat()[0] : null;
    const error = new Error(validationMessage || payload?.message || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function showLogin(message = '') {
  $('.app-shell').classList.add('logged-out');
  $('#appContent').innerHTML = `<section class="panel" style="max-width:460px;margin:10vh auto"><div class="page-head"><div><p class="eyebrow">TƏHLÜKƏSİZ GİRİŞ</p><h1>Hesabınıza daxil olun</h1><p>${escapeHtml(message || 'İdarəetmə panelinə davam etmək üçün məlumatlarınızı daxil edin.')}</p></div></div><form id="loginForm"><div class="form-body"><div class="field full"><label>E-poçt</label><input type="email" name="email" required autocomplete="email"></div><div class="field full"><label>Şifrə</label><input type="password" name="password" required autocomplete="current-password"></div><div class="form-actions"><button class="secondary-btn" id="showRegisterButton" type="button">Qeydiyyatdan keç</button><button class="primary-btn" type="submit">Daxil ol</button></div></div></form></section>`;
  $('#loginForm').onsubmit = login;
  $('#showRegisterButton').onclick = showRegister;
}

function showRegister() {
  $('#appContent').innerHTML = `<section class="panel" style="max-width:500px;margin:7vh auto"><div class="page-head"><div><p class="eyebrow">YENİ HESAB</p><h1>Qeydiyyatdan keçin</h1><p>Yeni hesab avtomatik müəllif rolu ilə yaradılacaq.</p></div></div><form id="registerForm"><div class="form-body"><div class="field full"><label>Ad və soyad</label><input name="name" required maxlength="255" autocomplete="name"></div><div class="field full"><label>E-poçt</label><input type="email" name="email" required autocomplete="email"></div><div class="field full"><label>Şifrə</label><input type="password" name="password" required minlength="8" autocomplete="new-password"></div><div class="field full"><label>Şifrənin təkrarı</label><input type="password" name="password_confirmation" required minlength="8" autocomplete="new-password"></div><div class="form-actions"><button class="secondary-btn" id="showLoginButton" type="button">Girişə qayıt</button><button class="primary-btn" type="submit">Hesab yarat</button></div></div></form></section>`;
  $('#registerForm').onsubmit = register;
  $('#showLoginButton').onclick = () => showLogin();
}

async function register(event) {
  event.preventDefault();
  try {
    const payload = await api('register', 'POST', Object.fromEntries(new FormData(event.currentTarget)));
    showLogin(payload.message || 'Qeydiyyat uğurla tamamlandı. İndi hesabınıza daxil olun.');
    toast('Hesabınız uğurla yaradıldı.');
  } catch (error) { toast(error.message, true); }
}

async function login(event) {
  event.preventDefault();
  try {
    const payload = await api('login', 'POST', Object.fromEntries(new FormData(event.currentTarget)));
    localStorage.setItem('northstar_token', payload.token);
    state.user = payload.user;
    await hydrate();
  } catch (error) { toast(error.message, true); }
}

async function logout() {
  try { await api('logout', 'POST'); } catch (_) {}
  localStorage.removeItem('northstar_token');
  state.user = null;
  showLogin('Sessiyanız bağlandı.');
}

async function hydrate() {
  try {
    state.user = await api('user');
    const requests = [api('categories'), api('posts')];
    if (state.user.role === 'admin') requests.push(api('users'));
    const [categories, posts, users] = await Promise.all(requests);
    state.categories = categories;
    state.posts = posts.map(post => ({ ...post, userId: post.user_id, categoryId: post.category_id, excerpt: post.short_description || '', createdAt: post.created_at }));
    state.users = users || [...new Map(state.posts.filter(post => post.author).map(post => [post.author.id, post.author])).values()];
    if (!state.users.some(user => user.id === state.user.id)) state.users.push(state.user);
    $('.app-shell').classList.remove('logged-out');
    $('#apiStatus').textContent = 'REST API aktivdir';
    $('#profileName').textContent = state.user.name;
    $('#profileRole').textContent = state.user.role;
    $('#profileAvatar').textContent = initials(state.user.name);
    $$('.admin-only').forEach(element => element.hidden = state.user.role !== 'admin');
    render();
  } catch (error) {
    $('#apiStatus').textContent = 'API əlçatan deyil';
    if (error.status === 401) {
      localStorage.removeItem('northstar_token');
      showLogin();
    } else showLogin(`API xətası: ${error.message}`);
  }
}

function pageHead(title, description, eyebrow = 'MƏZMUN İCMALI') {
  return `<div class="page-head"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></div><span class="date-badge">◷ ${new Intl.DateTimeFormat('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</span></div>`;
}

function stat(label, value, detail, icon) {
  return `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${String(value).padStart(2, '0')}</div><span class="trend neutral">${detail}</span></article>`;
}

function dashboard() {
  const published = state.posts.filter(post => post.status === 'published').length;
  return `${pageHead(`Salam, ${escapeHtml(state.user.name)}.`, 'Məzmun bazasının cari vəziyyəti.')}
    <div class="stats">${stat('Yazıların sayı', state.posts.length, 'Bazadakı bütün yazılar', '□')}${stat('Yayımlanmış', published, `${state.posts.length - published} qaralama`, '✓')}${stat('İstifadəçilər', state.user.role === 'admin' ? state.users.length : '—', state.user.role === 'admin' ? 'Qeydiyyatlı hesablar' : 'Yalnız admin üçün', '○')}${stat('Kateqoriyalar', state.categories.length, 'Aktiv kateqoriyalar', '◇')}</div>
    ${postsTable('Son yazılar', state.posts.slice(0, 5), false)}`;
}

function postsView() {
  const filtered = state.posts.filter(post => `${post.title} ${post.excerpt}`.toLowerCase().includes(state.query.toLowerCase()) && (state.category === 'all' || post.categoryId == state.category));
  const pages = Math.max(1, Math.ceil(filtered.length / CONFIG.perPage));
  state.page = Math.min(state.page, pages);
  const start = (state.page - 1) * CONFIG.perPage;
  return `${pageHead('Yazılar', 'Məzmunu yaradın, redaktə edin və idarə edin.', 'MƏZMUN KİTABXANASI')}<section class="panel table-panel"><div class="panel-head"><h2>Bütün yazılar <small>(${filtered.length})</small></h2><button class="primary-btn" data-action="new-post">＋ Yeni yazı</button></div><div class="toolbar"><label class="search-box">⌕<input id="listSearch" value="${escapeHtml(state.query)}" placeholder="Yazılarda axtar..."></label><select class="filter-select" id="categoryFilter"><option value="all">Bütün kateqoriyalar</option>${state.categories.map(category => `<option value="${category.id}" ${state.category == category.id ? 'selected' : ''}>${escapeHtml(category.name)}</option>`).join('')}</select></div>${postsTable('', filtered.slice(start, start + CONFIG.perPage), true, filtered.length, start, pages)}</section>`;
}

function postsTable(title, rows, full, total = rows.length, start = 0, pages = 1) {
  const table = rows.length ? `<table class="data-table"><thead><tr><th>Yazı</th><th>Kateqoriya</th><th>Müəllif</th><th>Status</th><th>Tarix</th><th></th></tr></thead><tbody>${rows.map(post => { const isOwner = post.userId === state.user.id; const canEdit = state.user.role === 'admin' || state.user.role === 'redaktor' || (state.user.role === 'author' && isOwner); const canDelete = state.user.role === 'admin' || (state.user.role === 'author' && isOwner); return `<tr><td><div class="title-cell"><span class="post-thumb">✦</span><div><b>${escapeHtml(post.title)}</b><small>#${String(post.id).padStart(3, '0')}</small></div></div></td><td>${escapeHtml(getCategory(post.categoryId)?.name || post.category?.name || '—')}</td><td>${escapeHtml(getUser(post.userId)?.name || post.author?.name || '—')}</td><td><span class="status ${post.status === 'draft' ? 'draft' : ''}">${post.status === 'published' ? 'Yayımlanıb' : 'Qaralama'}</span></td><td>${formatDate(post.createdAt)}</td><td><div class="actions"><button data-read-post="${post.id}" title="Oxu">◉</button>${canEdit ? `<button data-edit="post" data-id="${post.id}" title="Redaktə">✎</button>` : ''}${canDelete ? `<button data-delete="post" data-id="${post.id}" title="Sil">⌫</button>` : ''}</div></td></tr>`; }).join('')}</tbody></table>` : '<div class="empty"><b>Nəticə tapılmadı</b>Axtarış şərtlərini dəyişin.</div>';
  const footer = full ? `<div class="table-footer"><span>${total ? `${start + 1}–${Math.min(start + CONFIG.perPage, total)} / ${total}` : '0 nəticə'}</span><div class="pagination"><button data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''}>‹</button>${Array.from({ length: pages }, (_, index) => `<button data-page="${index + 1}" class="${state.page === index + 1 ? 'active' : ''}">${index + 1}</button>`).join('')}<button data-page="${state.page + 1}" ${state.page === pages ? 'disabled' : ''}>›</button></div></div>` : '';
  return `<section class="${title ? 'panel table-panel' : ''}">${title ? `<div class="panel-head"><h2>${title}</h2><button class="text-btn" data-view="posts">Hamısına bax →</button></div>` : ''}${table}${footer}</section>`;
}

function usersView() {
  return `${pageHead('İstifadəçilər', 'Komandanı və rolları idarə edin.', 'KOMANDA')}<div class="panel-head"><h2>Komanda üzvləri (${state.users.length})</h2><button class="primary-btn" data-action="new-user">＋ Yeni istifadəçi</button></div><div class="card-grid">${state.users.map(user => `<article class="entity-card"><div class="entity-top"><span class="entity-avatar">${initials(user.name)}</span><div><h3>${escapeHtml(user.name)}</h3><p>${escapeHtml(user.email)}</p></div><div class="actions"><button data-edit="user" data-id="${user.id}">✎</button><button data-delete="user" data-id="${user.id}">⌫</button></div></div><div class="entity-meta"><span>${escapeHtml(user.role)}</span><span class="status ${user.status === 'active' ? '' : 'inactive'}">${user.status === 'active' ? 'Aktiv' : 'Deaktiv'}</span></div></article>`).join('')}</div>`;
}

function categoriesView() {
  const canManage = ['admin', 'redaktor'].includes(state.user.role);
  return `${pageHead('Kateqoriyalar', 'Məzmunu səliqəli qruplaşdırın.', 'TAKSONOMİYA')}<div class="panel-head"><h2>Bütün kateqoriyalar (${state.categories.length})</h2>${canManage ? '<button class="primary-btn" data-action="new-category">＋ Yeni kateqoriya</button>' : ''}</div><div class="card-grid">${state.categories.map(category => `<article class="entity-card"><div class="entity-top"><span class="entity-avatar">${escapeHtml(category.name[0])}</span><div><h3>${escapeHtml(category.name)}</h3><p>/${escapeHtml(category.slug)}</p></div>${canManage ? `<div class="actions"><button data-edit="category" data-id="${category.id}">✎</button><button data-delete="category" data-id="${category.id}">⌫</button></div>` : ''}</div><p style="color:var(--muted);font-size:11px;min-height:28px;margin:18px 0">${escapeHtml(category.description || 'Açıqlama əlavə edilməyib')}</p><div class="entity-meta"><span>Yazıların sayı</span><b>${state.posts.filter(post => post.categoryId == category.id).length}</b></div></article>`).join('')}</div>`;
}

function render() {
  if (!state.user) return showLogin();
  if (state.view === 'users' && state.user.role !== 'admin') state.view = 'dashboard';
  $$('.nav-link[data-view]').forEach(link => link.classList.toggle('active', link.dataset.view === state.view));
  $('#postNavCount').textContent = state.posts.length;
  $('#appContent').innerHTML = state.view === 'posts' ? postsView() : state.view === 'users' ? usersView() : state.view === 'categories' ? categoriesView() : dashboard();
  $('#sidebar').classList.remove('open');
  bindDynamic();
}

function bindDynamic() {
  $('#listSearch')?.addEventListener('input', event => { state.query = event.target.value; state.page = 1; render(); });
  $('#categoryFilter')?.addEventListener('change', event => { state.category = event.target.value; state.page = 1; render(); });
  $$('[data-page]').forEach(button => button.onclick = () => { state.page = +button.dataset.page; render(); });
  $$('[data-view]').forEach(link => link.onclick = event => { event.preventDefault(); navigate(link.dataset.view); });
  $$('[data-action]').forEach(button => button.onclick = () => handleAction(button.dataset.action));
  $$('[data-edit]').forEach(button => button.onclick = () => openForm(button.dataset.edit, +button.dataset.id));
  $$('[data-delete]').forEach(button => button.onclick = () => removeEntity(button.dataset.delete, +button.dataset.id));
  $$('[data-read-post]').forEach(button => button.onclick = () => openPost(+button.dataset.readPost));
}

function navigate(view) { state.view = view; state.page = 1; location.hash = view; render(); }
function handleAction(action) { if (action === 'new-post') openForm('post'); if (action === 'new-user') openForm('user'); if (action === 'new-category') openForm('category'); if (action === 'close-modal') closeModal(); }

function openPost(id) {
  const post = state.posts.find(item => item.id === id);
  if (!post) return;
  $('#modalEyebrow').textContent = getCategory(post.categoryId)?.name || post.category?.name || 'YAZI';
  $('#modalTitle').textContent = post.title;
  $('#entityForm').innerHTML = `<div class="form-body"><div class="field full"><p style="color:var(--muted);margin:0">${escapeHtml(getUser(post.userId)?.name || post.author?.name || '—')} · ${formatDate(post.createdAt)}</p></div>${post.excerpt ? `<div class="field full"><strong>${escapeHtml(post.excerpt)}</strong></div>` : ''}<div class="field full"><div style="white-space:pre-wrap;line-height:1.75">${escapeHtml(post.content)}</div></div><div class="form-actions"><button type="button" class="primary-btn" data-action="close-modal">Bağla</button></div></div>`;
  $('#modalBackdrop').hidden = false;
  document.body.style.overflow = 'hidden';
  bindDynamic();
}

function openForm(type, id = null) {
  const collection = type === 'post' ? state.posts : type === 'user' ? state.users : state.categories;
  const item = id ? collection.find(entry => entry.id === id) : {};
  $('#modalTitle').textContent = id ? 'Məlumatı redaktə et' : 'Yeni məlumat';
  $('#entityForm').dataset.type = type; $('#entityForm').dataset.id = id || '';
  const availableAuthors = state.user.role === 'author' ? [state.user] : state.users;
  const postFields = `<div class="field full"><label>Başlıq *</label><input name="title" required value="${escapeHtml(item.title || '')}"></div><div class="field"><label>Müəllif *</label><select name="user_id" required>${availableAuthors.map(user => `<option value="${user.id}" ${item.userId == user.id ? 'selected' : ''}>${escapeHtml(user.name)}</option>`).join('')}</select></div><div class="field"><label>Kateqoriya *</label><select name="category_id" required>${state.categories.map(category => `<option value="${category.id}" ${item.categoryId == category.id ? 'selected' : ''}>${escapeHtml(category.name)}</option>`).join('')}</select></div><div class="field full"><label>Qısa təsvir</label><input name="short_description" maxlength="500" value="${escapeHtml(item.excerpt || '')}"></div><div class="field full"><label>Məzmun *</label><textarea name="content" required>${escapeHtml(item.content || '')}</textarea></div><div class="field"><label>Status</label><select name="status"><option value="draft" ${item.status === 'draft' ? 'selected' : ''}>Qaralama</option><option value="published" ${item.status === 'published' ? 'selected' : ''}>Yayımla</option></select></div>`;
  const userFields = `<div class="field full"><label>Ad və soyad *</label><input name="name" required value="${escapeHtml(item.name || '')}"></div><div class="field full"><label>E-poçt *</label><input type="email" name="email" required value="${escapeHtml(item.email || '')}"></div><div class="field full"><label>Şifrə ${id ? '(dəyişmirsə boş saxlayın)' : '*'}</label><input type="password" name="password" ${id ? '' : 'required'} minlength="8"></div><div class="field"><label>Rol</label><select name="role">${['admin', 'redaktor', 'author'].map(role => `<option value="${role}" ${item.role === role ? 'selected' : ''}>${role}</option>`).join('')}</select></div><div class="field"><label>Status</label><select name="status"><option value="active" ${item.status !== 'inactive' ? 'selected' : ''}>Aktiv</option><option value="inactive" ${item.status === 'inactive' ? 'selected' : ''}>Deaktiv</option></select></div>`;
  const categoryFields = `<div class="field full"><label>Kateqoriya adı *</label><input name="name" required value="${escapeHtml(item.name || '')}"></div><div class="field full"><label>Slug *</label><input name="slug" required value="${escapeHtml(item.slug || '')}"></div><div class="field full"><label>Açıqlama</label><textarea name="description">${escapeHtml(item.description || '')}</textarea></div>`;
  $('#entityForm').innerHTML = `<div class="form-body">${type === 'post' ? postFields : type === 'user' ? userFields : categoryFields}<div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Ləğv et</button><button class="primary-btn" type="submit">Yadda saxla</button></div></div>`;
  $('#modalBackdrop').hidden = false; document.body.style.overflow = 'hidden'; bindDynamic(); $('#entityForm').onsubmit = saveEntity;
}

async function saveEntity(event) {
  event.preventDefault();
  const type = event.currentTarget.dataset.type, id = event.currentTarget.dataset.id;
  const resource = type === 'post' ? 'posts' : type === 'user' ? 'users' : 'categories';
  const data = Object.fromEntries(new FormData(event.currentTarget));
  if (!data.password) delete data.password;
  if (type === 'post') { data.user_id = +data.user_id; data.category_id = +data.category_id; data.short_description ||= null; }
  try { await api(id ? `${resource}/${id}` : resource, id ? 'PUT' : 'POST', data); closeModal(); await hydrate(); toast(id ? 'Dəyişikliklər saxlanıldı.' : 'Məlumat əlavə edildi.'); } catch (error) { toast(error.message, true); }
}

async function removeEntity(type, id) {
  const resource = type === 'post' ? 'posts' : type === 'user' ? 'users' : 'categories';
  if (!confirm('Bu məlumatı silmək istədiyinizə əminsiniz?')) return;
  try { await api(`${resource}/${id}`, 'DELETE'); await hydrate(); toast('Məlumat silindi.'); } catch (error) { toast(error.message, true); }
}

function closeModal() { $('#modalBackdrop').hidden = true; document.body.style.overflow = ''; }
document.addEventListener('click', event => { if (event.target === $('#modalBackdrop')) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#globalSearch').focus(); } });
$('#menuToggle').onclick = () => $('#sidebar').classList.toggle('open');
$('#logoutButton').onclick = logout;
$('#globalSearch').addEventListener('input', event => { state.query = event.target.value; state.view === 'posts' ? render() : navigate('posts'); });
window.addEventListener('hashchange', () => { state.view = location.hash.slice(1) || 'dashboard'; render(); });
hydrate();
