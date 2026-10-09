/* Qadam account completion + secure admin control center. */
(() => {
  'use strict';

  const control = { categories: [], users: [], promos: [], openAccess: true, adminLoaded: false };
  const $one = selector => document.querySelector(selector);
  const safe = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const dateText = value => value ? new Date(value).toLocaleString('ru-RU') : '—';
  const rpc = (name, body = {}) => api(`rpc/${name}`, { method: 'POST', body: JSON.stringify(body) });

  function injectStyles() {
    if ($one('#qadamControlStyles')) return;
    const style = document.createElement('style');
    style.id = 'qadamControlStyles';
    style.textContent = `
      .username-gate{z-index:10050;background:rgba(17,26,39,.86);backdrop-filter:blur(8px)}
      .username-card{width:min(480px,100%);background:#fff;border:1px solid #dfe3e8;padding:28px;box-shadow:0 30px 90px rgba(17,24,39,.35)}
      .username-card h2{margin:14px 0 8px;color:#182435;font-size:25px}.username-card p{color:#687487;line-height:1.55;margin:0 0 18px}
      .username-preview{margin-top:8px;color:#8a94a4;font-size:12px}.username-card .btn{width:100%;margin-top:16px;height:46px}
      .control-center{margin-top:20px;display:grid;gap:16px}.control-card{background:#fff;border:1px solid var(--line);padding:18px}
      .control-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.control-head h2{font-size:17px;margin:0;color:var(--ink)}
      .control-head p{margin:4px 0 0;color:var(--muted);font-size:12px}.control-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
      .control-search{display:grid;grid-template-columns:1fr auto;gap:8px;margin-bottom:12px}.control-search input,.control-grid input{width:100%;height:40px;border:1px solid var(--line);padding:0 11px;background:#fff}
      .control-table-wrap{overflow:auto;border:1px solid var(--line)}.control-table{width:100%;border-collapse:collapse;min-width:760px}.control-table th,.control-table td{text-align:left;padding:11px;border-bottom:1px solid var(--line);font-size:12px;vertical-align:top}.control-table th{background:var(--soft);color:#667386}.control-table strong{display:block;color:var(--ink);font-size:13px}.control-table small{color:var(--muted)}
      .control-actions{display:flex;gap:6px;flex-wrap:wrap}.control-actions .btn{height:30px;padding:0 9px;font-size:11px}.control-list{display:grid;gap:8px}.control-row{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--line);padding:11px}.control-row p{margin:3px 0 0;color:var(--muted);font-size:12px}.control-pill{font-size:11px;font-weight:800;padding:4px 7px;background:#e7f5ee;color:#177950}.control-pill.off{background:#f1f2f4;color:#697586}
      .control-switch{border:0;padding:8px 12px;font-weight:800;background:#182435;color:#fff}.control-switch.on{background:#177950}
      .profile-username{font-size:13px;color:var(--muted);margin:3px 0 0}
      @media(max-width:780px){.control-grid{grid-template-columns:1fr}.control-head{align-items:flex-start}.control-row{align-items:flex-start;flex-direction:column}.control-search{grid-template-columns:1fr}.control-search .btn{width:100%}.control-card{padding:14px}}
    `;
    document.head.appendChild(style);
  }

  function installUsernameGate() {
    if ($one('#usernameGate')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-bg username-gate" id="usernameGate">
        <form class="username-card" id="usernameForm">
          <span class="logo-mark">Q</span>
          <h2>Создайте username</h2>
          <p>Это ваш уникальный адрес в Qadam. Он нужен для профиля и помогает администратору находить пользователя без UUID.</p>
          <div class="field"><label>Username</label><input id="newUsername" autocomplete="username" maxlength="24" placeholder="например, adil_web" required pattern="[A-Za-z][A-Za-z0-9_]{3,23}"><div class="username-preview" id="usernamePreview">qadam.app/@username</div></div>
          <button class="btn btn-dark" id="saveUsername">Продолжить</button>
          <button type="button" class="text-link" id="usernameLogout" style="display:block;margin:14px auto 0">Выйти из аккаунта</button>
        </form>
      </div>`);
    $one('#newUsername').addEventListener('input', event => {
      const value = event.target.value.replace(/[^A-Za-z0-9_]/g, '').slice(0, 24);
      event.target.value = value;
      $one('#usernamePreview').textContent = `qadam.app/@${value || 'username'}`;
    });
    $one('#usernameForm').addEventListener('submit', saveUsername);
    $one('#usernameLogout').addEventListener('click', () => $one('#pageLogoutBtn')?.click());
  }

  function usernameComplete() {
    return !!String(state?.profile?.username || '').trim();
  }

  function updateUsernameGate() {
    const gate = $one('#usernameGate');
    if (!gate) return;
    const shouldOpen = !!state?.user && !!state?.profile && !usernameComplete();
    gate.classList.toggle('open', shouldOpen);
    document.body.style.overflow = shouldOpen ? 'hidden' : '';
    if (state?.profile?.username) showProfileUsername();
  }

  async function saveUsername(event) {
    event.preventDefault();
    const input = $one('#newUsername');
    const button = $one('#saveUsername');
    const username = input.value.trim();
    if (!/^[A-Za-z][A-Za-z0-9_]{3,23}$/.test(username)) return toast('Username: 4–24 символа, первая буква латинская');
    button.disabled = true;
    button.textContent = 'Проверяем…';
    try {
      const result = await rpc('qadam_set_username', { new_username: username });
      state.profile = { ...(state.profile || {}), username: result.username || username };
      updateUsernameGate();
      showProfileUsername();
      toast('Username сохранён');
    } catch (error) {
      toast(error.message || 'Не удалось сохранить username');
    } finally {
      button.disabled = false;
      button.textContent = 'Продолжить';
    }
  }

  function showProfileUsername() {
    const title = $one('#pageProfileName');
    if (!title || !state?.profile?.username) return;
    let label = $one('#pageProfileUsername');
    if (!label) {
      label = document.createElement('p');
      label.id = 'pageProfileUsername';
      label.className = 'profile-username';
      title.insertAdjacentElement('afterend', label);
    }
    label.textContent = '@' + state.profile.username;
  }

  async function loadCategories() {
    try {
      const rows = await api('qadam_categories?select=*&order=sort_order.asc,name.asc');
      control.categories = Array.isArray(rows) ? rows.filter(row => row.active || state?.profile?.is_admin) : [];
      applyCategories();
      if (state?.profile?.is_admin) renderCategoryAdmin();
    } catch (error) {
      console.warn('Qadam categories:', error.message);
    }
  }

  function categoryClick(button) {
    state.category = button.dataset.category || '';
    document.querySelectorAll('[data-category]').forEach(node => node.classList.toggle('active', node.dataset.category === state.category));
    setView('catalog');
    render();
  }

  function applyCategories() {
    const active = control.categories.filter(row => row.active);
    if (!active.length) return;
    document.querySelectorAll('select[name="category"]').forEach(select => {
      const selected = select.value;
      select.innerHTML = active.map(row => `<option value="${safe(row.name)}">${safe(row.icon)} ${safe(row.name)}</option>`).join('');
      if ([...select.options].some(option => option.value === selected)) select.value = selected;
    });

    const chips = $one('#chips');
    if (chips) {
      chips.innerHTML = `<button class="chip ${state.category ? '' : 'active'}" data-category="">Все</button>` + active.map(row => `<button class="chip ${state.category === row.name ? 'active' : ''}" data-category="${safe(row.name)}">${safe(row.name)}</button>`).join('');
      chips.querySelectorAll('[data-category]').forEach(button => button.onclick = () => categoryClick(button));
    }

    const nav = $one('.side-nav');
    if (nav) {
      nav.querySelectorAll('[data-category]').forEach(node => node.remove());
      active.forEach(row => {
        const button = document.createElement('button');
        button.dataset.category = row.name;
        button.textContent = `${row.icon || '•'} ${row.name}`;
        button.onclick = () => categoryClick(button);
        nav.appendChild(button);
      });
    }
  }

  function installAdminCenter() {
    const view = $one('#view-admin');
    if (!view || $one('#qadamControlCenter')) return;
    view.insertAdjacentHTML('beforeend', `
      <div class="control-center" id="qadamControlCenter">
        <section class="control-card">
          <div class="control-head"><div><h2>Доступ к Telegram-заказам</h2><p>Сейчас оплату не подключаем. Можно открыть Premium всем одной кнопкой.</p></div><button class="control-switch" id="openAccessToggle">Загрузка…</button></div>
        </section>
        <section class="control-card">
          <div class="control-head"><div><h2>Все пользователи</h2><p>Поиск по username, имени, email или Telegram. UUID вводить не нужно.</p></div><span class="control-pill" id="usersTotal">0</span></div>
          <div class="control-search"><input id="adminUserSearch" placeholder="Например: @adil_web или email"><button class="btn btn-dark" id="adminUserSearchButton">Найти</button></div>
          <div class="control-table-wrap"><table class="control-table"><thead><tr><th>Пользователь</th><th>Telegram</th><th>Регистрация</th><th>Доступ</th><th>Действия</th></tr></thead><tbody id="adminUsersBody"><tr><td colspan="5">Загрузка…</td></tr></tbody></table></div>
        </section>
        <section class="control-card">
          <div class="control-head"><div><h2>Промокоды</h2><p>Создавайте коды заранее. Они пригодятся, когда бесплатный доступ будет выключен.</p></div></div>
          <form class="control-grid" id="promoCreateForm"><input name="code" required maxlength="32" placeholder="Код, например START30"><input name="days" required type="number" min="1" max="3650" value="30" placeholder="Дней"><input name="max_uses" type="number" min="1" placeholder="Лимит активаций"><button class="btn btn-dark">Создать промокод</button></form>
          <div class="control-list" id="promoAdminList" style="margin-top:14px"></div>
        </section>
        <section class="control-card">
          <div class="control-head"><div><h2>Категории</h2><p>Новая категория сразу появится в фильтрах и формах публикации.</p></div></div>
          <form class="control-grid" id="categoryCreateForm"><input name="icon" maxlength="8" value="•" placeholder="Иконка"><input name="name" required maxlength="60" placeholder="Название категории"><input name="description" maxlength="160" placeholder="Короткое описание"><button class="btn btn-dark">Добавить категорию</button></form>
          <div class="control-list" id="categoryAdminList" style="margin-top:14px"></div>
        </section>
      </div>`);

    $one('#openAccessToggle').onclick = toggleOpenAccess;
    $one('#adminUserSearchButton').onclick = loadUsers;
    $one('#adminUserSearch').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); loadUsers(); } });
    $one('#promoCreateForm').onsubmit = createPromo;
    $one('#categoryCreateForm').onsubmit = createCategory;
  }

  async function loadAdminCenter() {
    if (!state?.profile?.is_admin) return;
    installAdminCenter();
    await Promise.allSettled([loadOpenAccess(), loadUsers(), loadPromos(), loadCategories()]);
    control.adminLoaded = true;
  }

  async function loadOpenAccess() {
    const result = await rpc('qadam_admin_open_access_status');
    control.openAccess = result === true;
    renderOpenAccess();
  }

  function renderOpenAccess() {
    const button = $one('#openAccessToggle');
    if (!button) return;
    button.classList.toggle('on', control.openAccess);
    button.textContent = control.openAccess ? 'Открыто бесплатно' : 'Доступ по разрешению';
  }

  async function toggleOpenAccess() {
    if (!confirm(control.openAccess ? 'Выключить бесплатный доступ для всех? Доступ останется у выданных вручную и по промокоду.' : 'Открыть Telegram-заказы бесплатно всем вошедшим пользователям?')) return;
    try {
      await rpc('qadam_admin_set_open_access', { enabled: !control.openAccess });
      control.openAccess = !control.openAccess;
      renderOpenAccess();
      window.qadamSyncPremium?.({ startTrial: false });
      toast(control.openAccess ? 'Бесплатный доступ включён' : 'Бесплатный доступ выключен');
    } catch (error) { toast(error.message || 'Не удалось изменить настройку'); }
  }

  async function loadUsers() {
    const query = $one('#adminUserSearch')?.value.trim() || '';
    try {
      const allRows = [];
      let offset = 0;
      while (true) {
        const rows = await rpc('qadam_admin_users', { search_text: query, page_size: 200, page_offset: offset });
        const page = Array.isArray(rows) ? rows : [];
        allRows.push(...page);
        if (page.length < 200) break;
        offset += 200;
      }
      control.users = allRows;
      renderUsers();
    } catch (error) {
      const body = $one('#adminUsersBody');
      if (body) body.innerHTML = `<tr><td colspan="5">${safe(error.message)}</td></tr>`;
    }
  }

  function userIdentifier(user) { return user.email || user.username || user.telegram_username || ''; }

  function renderUsers() {
    const body = $one('#adminUsersBody');
    if (!body) return;
    $one('#usersTotal').textContent = String(control.users.length);
    body.innerHTML = control.users.length ? control.users.map((user, index) => {
      const identifier = userIdentifier(user);
      const access = user.is_admin ? 'Администратор' : user.manual_access ? 'Бессрочно' : user.premium_until && new Date(user.premium_until) > new Date() ? `до ${new Date(user.premium_until).toLocaleDateString('ru-RU')}` : control.openAccess ? 'Бесплатно для всех' : 'Нет доступа';
      return `<tr><td><strong>${safe(user.display_name || 'Без имени')} ${user.blocked ? '⛔' : ''}</strong><small>@${safe(user.username || 'username не создан')}<br>${safe(user.email || 'email скрыт')}</small></td><td>${user.telegram_username ? '@' + safe(user.telegram_username) : '—'}</td><td>${safe(dateText(user.created_at))}</td><td>${safe(access)}</td><td><div class="control-actions"><button class="btn" data-grant-days="30" data-user-index="${index}">+30 дней</button><button class="btn" data-grant-days="0" data-user-index="${index}">Бессрочно</button><button class="btn btn-danger" data-revoke-user="${index}">Отозвать</button></div></td></tr>`;
    }).join('') : '<tr><td colspan="5">Пользователи не найдены</td></tr>';
    body.querySelectorAll('[data-grant-days]').forEach(button => button.onclick = () => grantAccess(control.users[Number(button.dataset.userIndex)], Number(button.dataset.grantDays)));
    body.querySelectorAll('[data-revoke-user]').forEach(button => button.onclick = () => revokeAccess(control.users[Number(button.dataset.revokeUser)]));
  }

  async function grantAccess(user, days) {
    const identifier = userIdentifier(user);
    if (!identifier) return toast('У пользователя нет email или username');
    if (!confirm(days ? `Добавить пользователю ${identifier} ${days} дней доступа?` : `Выдать пользователю ${identifier} бессрочный доступ?`)) return;
    try { await rpc('qadam_admin_grant_access', { identifier, access_days: days }); await loadUsers(); toast('Доступ выдан'); }
    catch (error) { toast(error.message || 'Не удалось выдать доступ'); }
  }

  async function revokeAccess(user) {
    const identifier = userIdentifier(user);
    if (!identifier || !confirm(`Отозвать ручной доступ у ${identifier}?`)) return;
    try { await rpc('qadam_admin_revoke_access', { identifier }); await loadUsers(); toast('Доступ отозван'); }
    catch (error) { toast(error.message || 'Не удалось отозвать доступ'); }
  }

  async function loadPromos() {
    try {
      const rows = await api('premium_promo_codes?select=*&order=created_at.desc');
      control.promos = Array.isArray(rows) ? rows : [];
      renderPromos();
    } catch (error) { console.warn('Promo list:', error.message); }
  }

  async function createPromo(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const row = {
      code: String(form.get('code') || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
      duration_days: Number(form.get('days')),
      max_uses: form.get('max_uses') ? Number(form.get('max_uses')) : null,
      created_by: state.user.id
    };
    if (row.code.length < 3) return toast('Код должен быть не короче 3 символов');
    try { await api('premium_promo_codes', { method: 'POST', body: JSON.stringify(row) }); event.target.reset(); event.target.days.value = 30; await loadPromos(); toast('Промокод создан'); }
    catch (error) { toast(error.message || 'Не удалось создать промокод'); }
  }

  function renderPromos() {
    const list = $one('#promoAdminList');
    if (!list) return;
    list.innerHTML = control.promos.length ? control.promos.map((promo, index) => `<div class="control-row"><div><strong>${safe(promo.code)}</strong><p>${promo.duration_days} дней · использовано ${promo.uses_count}${promo.max_uses ? ' из ' + promo.max_uses : ''}</p></div><div class="control-actions"><span class="control-pill ${promo.active ? '' : 'off'}">${promo.active ? 'Активен' : 'Выключен'}</span><button class="btn" data-toggle-promo="${index}">${promo.active ? 'Выключить' : 'Включить'}</button></div></div>`).join('') : '<div class="empty-small">Промокодов пока нет.</div>';
    list.querySelectorAll('[data-toggle-promo]').forEach(button => button.onclick = () => togglePromo(control.promos[Number(button.dataset.togglePromo)]));
  }

  async function togglePromo(promo) {
    try { await api(`premium_promo_codes?code=eq.${encodeURIComponent(promo.code)}`, { method: 'PATCH', body: JSON.stringify({ active: !promo.active }) }); await loadPromos(); }
    catch (error) { toast(error.message || 'Не удалось изменить промокод'); }
  }

  async function createCategory(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const row = { icon: String(form.get('icon') || '•').trim() || '•', name: String(form.get('name') || '').trim(), description: String(form.get('description') || '').trim(), sort_order: control.categories.length * 10 + 10 };
    if (row.name.length < 2) return toast('Введите название категории');
    try { await api('qadam_categories', { method: 'POST', body: JSON.stringify(row) }); event.target.reset(); event.target.icon.value = '•'; await loadCategories(); toast('Категория добавлена'); }
    catch (error) { toast(error.message || 'Не удалось добавить категорию'); }
  }

  function renderCategoryAdmin() {
    const list = $one('#categoryAdminList');
    if (!list) return;
    list.innerHTML = control.categories.length ? control.categories.map((category, index) => `<div class="control-row"><div><strong>${safe(category.icon)} ${safe(category.name)}</strong><p>${safe(category.description || 'Без описания')}</p></div><div class="control-actions"><span class="control-pill ${category.active ? '' : 'off'}">${category.active ? 'Показывается' : 'Скрыта'}</span><button class="btn" data-toggle-category="${index}">${category.active ? 'Скрыть' : 'Показать'}</button></div></div>`).join('') : '<div class="empty-small">Категорий пока нет.</div>';
    list.querySelectorAll('[data-toggle-category]').forEach(button => button.onclick = () => toggleCategory(control.categories[Number(button.dataset.toggleCategory)]));
  }

  async function toggleCategory(category) {
    try { await api(`qadam_categories?id=eq.${encodeURIComponent(category.id)}`, { method: 'PATCH', body: JSON.stringify({ active: !category.active }) }); await loadCategories(); toast('Категория обновлена'); }
    catch (error) { toast(error.message || 'Не удалось изменить категорию'); }
  }

  function patchNavigation() {
    if (typeof window.setView !== 'function' || window.setView.__qadamControlPatched) return;
    const original = window.setView;
    const patched = function(view) {
      const result = original(view);
      if (view === 'admin' && state?.profile?.is_admin) setTimeout(loadAdminCenter, 0);
      return result;
    };
    patched.__qadamControlPatched = true;
    window.setView = patched;
  }

  function boot() {
    injectStyles();
    installUsernameGate();
    installAdminCenter();
    patchNavigation();
    loadCategories();
    setInterval(() => {
      updateUsernameGate();
      showProfileUsername();
      if (state?.profile?.is_admin && state.view === 'admin' && !control.adminLoaded) loadAdminCenter();
    }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
