<!doctype html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Blog API idarəetmə paneli">
  <title>Northstar — Blog Console</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body>
  <div class="app-shell">
    <aside class="sidebar" id="sidebar">
      <a class="brand" href="#dashboard" aria-label="Northstar ana səhifə"><span class="brand-mark">N</span><span><b>northstar</b><small>CONTENT OS</small></span></a>
      <nav class="nav" aria-label="Əsas menyu">
        <p class="nav-label">İŞ SAHƏSİ</p>
        <a class="nav-link active" data-view="dashboard" href="#dashboard"><span class="nav-icon">⌂</span>İcmal</a>
        <a class="nav-link" data-view="posts" href="#posts"><span class="nav-icon">□</span>Yazılar <span class="nav-count" id="postNavCount">0</span></a>
        <a class="nav-link" data-view="categories" href="#categories"><span class="nav-icon">◇</span>Kateqoriyalar</a>
        <a class="nav-link admin-only" data-view="users" href="#users"><span class="nav-icon">○</span>İstifadəçilər</a>
      </nav>
      <div class="sidebar-card"><div class="pulse"></div><div><b>API statusu</b><span id="apiStatus">Yoxlanılır</span></div></div>
      <div class="sidebar-footer"><span class="avatar" id="profileAvatar">?</span><div class="profile-details"><b id="profileName">Qonaq</b><small id="profileRole">—</small></div><button class="logout-button" id="logoutButton" type="button" title="Hesabdan çıx">Çıxış</button></div>
    </aside>
    <main class="main">
      <header class="topbar">
        <button class="menu-toggle" id="menuToggle" aria-label="Menyunu aç">☰</button>
        <div class="global-search"><span>⌕</span><input id="globalSearch" type="search" placeholder="Yazılarda axtar..."><kbd>Ctrl K</kbd></div>
        <div class="top-actions"><button class="primary-btn" data-action="new-post"><span>＋</span> Yeni yazı</button></div>
      </header>
      <section class="content" id="appContent" aria-live="polite"></section>
    </main>
  </div>
  <div class="modal-backdrop" id="modalBackdrop" hidden><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><header><div><p id="modalEyebrow">MƏZMUN</p><h2 id="modalTitle">Yeni yazı</h2></div><button class="close-btn" data-action="close-modal" aria-label="Bağla">×</button></header><form id="entityForm"></form></section></div>
  <div class="toast-stack" id="toastStack" aria-live="assertive"></div>
  <script src="/assets/js/app.js?v={{ filemtime(public_path('assets/js/app.js')) }}"></script>
</body>
</html>
