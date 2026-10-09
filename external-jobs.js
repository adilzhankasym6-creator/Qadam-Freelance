/* Qadam Premium + Telegram orders. Load after the main inline script. */
(() => {
  const externalState = { rows: [], loaded: false, error: '' };
  const premiumState = { active: false, type: 'loading', trial_ends_at: null, premium_until: null };
  const categories = [
    'Сайты','Разработка','Мобильные приложения','Telegram-боты','Администрирование',
    'Дизайн','Карточки товаров','3D и архитектура','AI-контент','Видео и анимация',
    'Фото и ретушь','Тексты и копирайтинг','Переводы','Аудио и музыка','Маркетинг',
    'SMM и контент','Маркетплейсы','Бизнес и консультации','Аналитика и данные','Обучение','Другое'
  ];

  // Premium data must not stay visible from an old browser cache after access expires.
  localStorage.removeItem('qadam_external_jobs_cache_v4');

  const sourceIsTelegram = value => {
    try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 't.me'; }
    catch { return false; }
  };

  function updateAuthLabels() {
    const publish = document.querySelector('#openPublish');
    if (publish) publish.textContent = state.user ? 'Разместить' : 'Войти и разместить';
    const note = document.querySelector('#loginBlock .login-note');
    if (note) note.textContent = 'Вход через Google защищает объявления от спама. После входа вы сможете опубликовать заказ.';
  }

  function installAuthGuard() {
    const publish = document.querySelector('#openPublish');
    if (publish) publish.addEventListener('click', () => {
      if (!state.user) localStorage.setItem('qadam_pending_publish', String(Date.now()));
    }, true);
    updateAuthLabels();

    const hasSessionHint = !!localStorage.getItem('qadam_user') ||
      Object.keys(localStorage).some(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
    if (!hasSessionHint || !supabaseClient) return;

    const guard = document.createElement('div');
    guard.id = 'qadamAuthGuard';
    guard.innerHTML = '<div><span class="logo-mark" style="margin:auto">Q</span><strong>Восстанавливаем вход…</strong><small>Проверяем профиль и Telegram</small></div>';
    guard.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#f4f5f6;display:grid;place-items:center;text-align:center;color:#182435';
    guard.querySelector('div').style.cssText = 'display:grid;gap:12px';
    guard.querySelector('small').style.cssText = 'color:#748094';
    document.body.appendChild(guard);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      guard.remove();
      updateAuthLabels();
      const pendingAt = Number(localStorage.getItem('qadam_pending_publish') || 0);
      if (state.user && pendingAt && Date.now() - pendingAt < 30 * 60 * 1000) {
        localStorage.removeItem('qadam_pending_publish');
        setTimeout(() => document.querySelector('#openPublish')?.click(), 100);
      }
    };

    const started = Date.now();
    const timer = setInterval(() => {
      if (state.profile?.telegram_username && !state.telegramLinked) {
        state.telegramLinked = true;
        localStorage.setItem('qadam_telegram_' + state.user?.id, String(state.profile.telegram_username).replace(/^@/, ''));
        updateAccount();
      }
      const profileReady = state.user && !document.querySelector('#profileContent')?.classList.contains('hidden');
      if (profileReady || Date.now() - started > 12000) {
        clearInterval(timer);
        finish();
      }
    }, 100);

    supabaseClient.auth.getSession().then(({ data }) => {
      if (!data?.session) {
        clearInterval(timer);
        localStorage.removeItem('qadam_user');
        localStorage.removeItem('qadam_access_token');
        finish();
      }
    }).catch(() => {
      clearInterval(timer);
      finish();
    });
  }

  function normalizeStatus(value) {
    const row = Array.isArray(value) ? value[0] : value;
    return row && typeof row === 'object'
      ? { active: !!row.active, type: row.type || 'not_started', trial_ends_at: row.trial_ends_at || null, premium_until: row.premium_until || null }
      : { active: false, type: 'not_started', trial_ends_at: null, premium_until: null };
  }

  async function premiumRpc(name) {
    return normalizeStatus(await api(`rpc/${name}`, { method: 'POST', body: '{}' }));
  }

  function accessDeadline() {
    return premiumState.type === 'premium' ? premiumState.premium_until : premiumState.trial_ends_at;
  }

  function remainingLabel() {
    if (premiumState.type === 'admin') return 'Доступ администратора';
    const deadline = new Date(accessDeadline() || 0).getTime();
    const hours = Math.ceil(Math.max(0, deadline - Date.now()) / 36e5);
    if (hours < 24) return `${hours} ч. осталось`;
    return `${Math.ceil(hours / 24)} дн. осталось`;
  }

  function installPremiumUi() {
    // The current Qadam layout uses a plain <main> element. Keep the old
    // selector as a fallback so Premium works with both layout versions.
    const main = document.querySelector('main.content') || document.querySelector('main');
    if (main && !document.querySelector('#view-premium')) {
      main.insertAdjacentHTML('beforeend', `
        <section class="view" id="view-premium">
          <div class="premium-shell">
            <section class="premium-hero">
              <div><span class="premium-kicker">Qadam Premium</span><h1>Заказы из Telegram<br>в одном месте</h1><p>Свежие объявления по разным категориям. Отклик открывается только через оригинальный Telegram-пост.</p></div>
              <div class="premium-price"><strong>2 500 ₸</strong><span>за 30 дней</span></div>
            </section>
            <div id="premiumContent"></div>
          </div>
        </section>`);
    }

    const nav = document.querySelector('.side-nav');
    if (nav && !document.querySelector('#premiumNav')) {
      const catalogButton = nav.querySelector('[data-view="catalog"]');
      catalogButton?.insertAdjacentHTML('afterend', '<button id="premiumNav" data-view="premium"><span class="side-icon">✦</span>Premium <span class="premium-nav-badge">7 дней</span></button>');
      document.querySelector('#premiumNav').onclick = event => {
        event.preventDefault();
        openPremium();
      };
    }

    const feedHead = document.querySelector('#view-catalog .feed-head');
    if (feedHead && !document.querySelector('#premiumPromo')) {
      feedHead.insertAdjacentHTML('beforebegin', `
        <section class="premium-promo" id="premiumPromo">
          <div><span class="premium-promo-icon">✦</span><strong>Telegram-заказы в Qadam Premium</strong><small id="premiumPromoText">7 дней бесплатно</small></div>
          <button class="btn" id="premiumPromoButton">Открыть</button>
        </section>`);
      document.querySelector('#premiumPromoButton').onclick = openPremium;
    }
  }

  function openPremium() {
    if (!state.user) {
      openModal('accountModal');
      return toast('Войдите через Google — получите 7 дней Premium бесплатно');
    }
    setView('premium');
    renderPremium();
  }
  window.qadamOpenPremium = openPremium;

  function card(row) {
    const source = String(row.source_url || '');
    const hasForeignCurrency = /(?:\$|€|USD|EUR|доллар|евро)/i.test(String(row.budget || ''));
    const shownBudget = hasForeignCurrency
      ? String(row.budget || 'Договорная')
      : window.qadamFormatBudget
      ? window.qadamFormatBudget(row.budget, row.location, row.currency)
      : row.budget;
    const adminDelete = state.profile?.is_admin
      ? `<button class="btn btn-danger" data-delete-external="${esc(row.id)}">Удалить</button>`
      : '';
    return `<article class="job external-job" data-external-category="${esc(row.category)}" data-external-search="${esc(`${row.title} ${row.description} ${(row.skills || []).join(' ')}`.toLowerCase())}">
      <div class="job-body">
        <div class="job-top">
          <span class="tag">${esc(row.category)}</span>
          <span class="tag tag-new">Premium · Telegram</span>
          <span class="job-time">до ${new Date(row.expires_at).toLocaleDateString('ru-RU')}</span>
        </div>
        <h2>${esc(row.title)}</h2>
        <p>${esc(row.description)}</p>
        <div class="skills">${(row.skills || []).map(item => `<span>${esc(item)}</span>`).join('')}</div>
        <div class="author">
          <span class="author-pic">T</span>
          <div><strong>${esc(row.source_name || 'Telegram')}</strong><small>Внешний заказ · отклик только в оригинальном посте</small></div>
        </div>
      </div>
      <aside class="job-side">
        <div><span class="budget-label">Бюджет</span><strong class="budget">${esc(shownBudget)}</strong></div>
        <div class="job-actions">
          <a class="btn btn-primary" href="${esc(source)}" target="_blank" rel="noopener noreferrer">Оригинал в Telegram</a>
          ${adminDelete}
        </div>
        <span class="reply-count">${esc(row.location || 'Удалённо')} · исчезнет через 7 дней</span>
      </aside>
    </article>`;
  }

  function updateCombinedCounts() {
    const internalCount = typeof activeJobs === 'function'
      ? activeJobs().length
      : (state.jobs || []).filter(row => row.status === 'active').length;
    const total = internalCount + (premiumState.active ? externalState.rows.length : 0);
    const all = document.querySelector('#allCount');
    const side = document.querySelector('#sideCount');
    if (all) all.textContent = String(total);
    if (side) side.textContent = String(total);
  }

  function bindExternalDelete() {
    document.querySelectorAll('[data-delete-external]').forEach(button => {
      button.onclick = async () => {
        if (!confirm('Удалить внешний заказ?')) return;
        try {
          await api(`external_jobs?id=eq.${encodeURIComponent(button.dataset.deleteExternal)}`, { method: 'DELETE' });
          await loadExternal();
          toast('Внешний заказ удалён');
        } catch (error) { toast(error.message || 'Не удалось удалить заказ'); }
      };
    });
  }

  function filteredRows() {
    const query = String(document.querySelector('#search')?.value || '').trim().toLowerCase();
    const category = state.category || '';
    return externalState.rows.filter(row =>
      (!category || row.category === category) &&
      (!query || `${row.title} ${row.description} ${(row.skills || []).join(' ')}`.toLowerCase().includes(query))
    );
  }

  function renderExternal() {
    document.querySelectorAll('#jobList .external-job').forEach(node => node.remove());
    const list = document.querySelector('#jobList');
    if (list && premiumState.active) {
      const visible = filteredRows();
      if (visible.length) {
        if (!list.querySelector('.job')) list.querySelector('.empty')?.remove();
        list.insertAdjacentHTML('beforeend', visible.map(card).join(''));
      }
    }
    renderPremium();
    bindExternalDelete();
    updateCombinedCounts();
  }

  function renderPremium() {
    installPremiumUi();
    const content = document.querySelector('#premiumContent');
    const promoText = document.querySelector('#premiumPromoText');
    const promoButton = document.querySelector('#premiumPromoButton');
    const badge = document.querySelector('#premiumNav .premium-nav-badge');
    if (!content) return;

    if (!state.user || premiumState.type === 'guest') {
      content.innerHTML = '<section class="premium-paywall"><span class="premium-lock">✦</span><h2>7 дней бесплатно</h2><p>Войдите через Google, чтобы открыть свежие Telegram-заказы.</p><button class="btn btn-dark" data-premium-login>Войти через Google</button></section>';
      content.querySelector('[data-premium-login]')?.addEventListener('click', () => openModal('accountModal'));
      if (promoText) promoText.textContent = '7 дней бесплатно после входа';
      if (promoButton) promoButton.textContent = 'Попробовать';
      if (badge) badge.textContent = '7 дней';
      return;
    }

    if (premiumState.type === 'loading') {
      content.innerHTML = '<div class="premium-loading">Проверяем доступ…</div>';
      return;
    }

    if (!premiumState.active) {
      const setupRequired = premiumState.type === 'setup_required';
      content.innerHTML = `<section class="premium-paywall"><span class="premium-lock">✦</span><h2>${setupRequired ? 'Premium ещё не настроен' : 'Пробный период закончился'}</h2><p>${setupRequired ? 'Администратору нужно один раз запустить файл qadam_premium.sql в Supabase.' : 'Telegram-заказы скрыты. Qadam Premium стоит 2 500 ₸ за 30 дней.'}</p>${setupRequired ? '' : '<div class="premium-plan"><strong>2 500 ₸</strong><span>30 дней доступа</span></div><button class="btn btn-dark" data-premium-help>Как подключить</button><small>Пока оплату и активацию подтверждает администратор. Автосписаний нет.</small>'}</section>`;
      content.querySelector('[data-premium-help]')?.addEventListener('click', () => toast('Попросите администратора активировать Premium. Онлайн-оплату добавим отдельно.'));
      if (promoText) promoText.textContent = premiumState.type === 'setup_required' ? 'Сначала установите qadam_premium.sql' : 'Пробный период закончился';
      if (promoButton) promoButton.textContent = 'Подключить';
      if (badge) badge.textContent = '2 500 ₸';
      return;
    }

    const label = remainingLabel();
    const typeLabel = premiumState.type === 'premium' ? 'Premium активен' : premiumState.type === 'admin' ? 'Доступ администратора' : 'Пробный Premium';
    const jobs = externalState.rows.length
      ? externalState.rows.map(card).join('')
      : externalState.error
      ? '<div class="empty-small">Не удалось получить Telegram-заказы с сервера.<br><button class="btn" data-premium-refresh style="margin-top:10px">Попробовать снова</button></div>'
      : '<div class="empty-small">Свежих Telegram-заказов пока нет. Перешлите боту новое объявление из публичного канала.</div>';
    content.innerHTML = `<div class="premium-status"><div><strong>${typeLabel}</strong><span>${label}</span></div><span class="premium-live">Активен</span></div><div class="job-list premium-job-list">${jobs}</div>`;
    content.querySelector('[data-premium-refresh]')?.addEventListener('click', loadExternal);
    if (promoText) promoText.textContent = `${typeLabel} · ${label}`;
    if (promoButton) promoButton.textContent = 'Смотреть';
    if (badge) badge.textContent = premiumState.type === 'trial' ? label.replace(' осталось', '') : 'Активен';
  }

  async function loadExternal() {
    if (!premiumState.active || !state.user) {
      externalState.rows = [];
      externalState.loaded = true;
      renderExternal();
      return;
    }
    try {
      const rows = await api('rpc/qadam_premium_orders', { method: 'POST', body: '{}' });
      externalState.rows = Array.isArray(rows) ? rows : [];
      externalState.loaded = true;
      externalState.error = '';
    } catch (error) {
      console.warn('Premium orders:', error.message);
      externalState.rows = [];
      externalState.error = error.message || 'Ошибка загрузки';
      if (state.view === 'premium') toast('Не удалось загрузить Premium-заказы');
    }
    renderExternal();
  }

  async function syncPremium({ startTrial = true } = {}) {
    if (!state.user) {
      Object.assign(premiumState, { active: false, type: 'guest', trial_ends_at: null, premium_until: null });
      externalState.rows = [];
      renderExternal();
      return;
    }
    try {
      let status = await premiumRpc('qadam_premium_status');
      if (status.type === 'not_started' && startTrial) status = await premiumRpc('qadam_start_premium_trial');
      Object.assign(premiumState, status);
      if (premiumState.active) await loadExternal();
      else {
        externalState.rows = [];
        renderExternal();
      }
    } catch (error) {
      console.warn('Premium status:', error.message);
      Object.assign(premiumState, { active: false, type: 'setup_required' });
      externalState.rows = [];
      renderExternal();
    }
  }

  function installAdminForm() {
    if (document.querySelector('#externalJobModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-bg" id="externalJobModal"><div class="modal">
        <header class="modal-head"><div><h2>Внешний заказ из Telegram</h2><p>Показывается 7 дней, без внутренних откликов</p></div><button class="close" data-external-close>×</button></header>
        <form class="modal-body" id="externalJobForm">
          <div class="section-note">Добавляйте краткий пересказ и обязательно оставляйте ссылку на оригинал.</div>
          <div class="form-grid">
            <div class="field full"><label>Название</label><input name="title" minlength="8" maxlength="100" required></div>
            <div class="field"><label>Категория</label><select name="category">${categories.map(item => `<option>${item}</option>`).join('')}</select></div>
            <div class="field"><label>Бюджет</label><input name="budget" maxlength="40" required placeholder="Например, 80 000 ₸"></div>
            <div class="field full"><label>Город / формат</label><input name="location" value="Удалённо"></div>
            <div class="field full"><label>Ссылка на оригинальный пост</label><input name="source_url" type="url" required placeholder="https://t.me/channel/123"></div>
            <div class="field full"><label>Название источника</label><input name="source_name" maxlength="80" required placeholder="Название Telegram-канала"></div>
            <div class="field full"><label>Краткий пересказ</label><textarea name="description" minlength="30" maxlength="1000" rows="6" required></textarea></div>
            <div class="field full"><label>Навыки через запятую</label><input name="skills" placeholder="Figma, Webflow, адаптив"></div>
          </div>
          <div class="modal-actions"><button type="button" class="btn" data-external-close>Отмена</button><button class="btn btn-primary">Опубликовать на 7 дней</button></div>
        </form>
      </div></div>`);

    document.querySelectorAll('[data-external-close]').forEach(button => {
      button.onclick = () => document.querySelector('#externalJobModal').classList.remove('open');
    });
    document.querySelector('#externalJobModal').onclick = event => {
      if (event.target.id === 'externalJobModal') event.currentTarget.classList.remove('open');
    };
    document.querySelector('#externalJobForm').onsubmit = async event => {
      event.preventDefault();
      if (!state.user || !state.profile?.is_admin) return toast('Нужны права администратора');
      const form = new FormData(event.target);
      const sourceUrl = String(form.get('source_url') || '').trim();
      if (!sourceIsTelegram(sourceUrl)) return toast('Нужна ссылка вида https://t.me/...');
      const row = {
        created_by: state.user.id,
        title: String(form.get('title') || '').trim(),
        category: String(form.get('category') || ''),
        description: String(form.get('description') || '').trim(),
        budget: String(form.get('budget') || '').trim(),
        location: String(form.get('location') || '').trim() || 'Удалённо',
        skills: String(form.get('skills') || '').split(',').map(item => item.trim()).filter(Boolean).slice(0, 20),
        telegram_username: null,
        source_url: sourceUrl,
        source_name: String(form.get('source_name') || '').trim(),
        permission_confirmed: false,
        imported_via: 'manual',
        status: 'active',
        expires_at: new Date(Date.now() + 7 * 864e5).toISOString()
      };
      try {
        await api('external_jobs', { method: 'POST', body: JSON.stringify(row) });
        event.target.reset();
        document.querySelector('#externalJobModal').classList.remove('open');
        await loadExternal();
        setView('premium');
        toast('Внешний заказ опубликован на 7 дней');
      } catch (error) { toast(error.message || 'Не удалось опубликовать заказ'); }
    };
  }

  function installAdminButton() {
    if (!state.profile?.is_admin) return;
    const view = document.querySelector('#view-admin');
    if (view && !document.querySelector('#openExternalJob')) {
      const button = document.createElement('button');
      button.id = 'openExternalJob';
      button.className = 'btn btn-primary';
      button.style.marginLeft = '8px';
      button.textContent = 'Добавить заказ из Telegram';
      button.onclick = () => document.querySelector('#externalJobModal').classList.add('open');
      view.querySelector('#refreshReports')?.insertAdjacentElement('afterend', button);
    }
    const profileActions = document.querySelector('.profile-actions');
    if (profileActions && !document.querySelector('#mobileAdminButton')) {
      const mobileButton = document.createElement('button');
      mobileButton.id = 'mobileAdminButton';
      mobileButton.className = 'btn btn-dark';
      mobileButton.textContent = 'Модерация';
      mobileButton.onclick = () => setView('admin');
      profileActions.prepend(mobileButton);
    }
  }

  const originalRender = render;
  render = function () {
    originalRender();
    updateAuthLabels();
    renderExternal();
    installAdminButton();
  };

  async function bootPremium() {
    installPremiumUi();
    if (supabaseClient) {
      try {
        const { data } = await supabaseClient.auth.getSession();
        if (!data?.session) {
          state.user = null;
          state.profile = null;
          localStorage.removeItem('qadam_user');
          localStorage.removeItem('qadam_access_token');
          updateAccount();
        } else if (!state.user) {
          for (let i = 0; i < 50 && !state.user; i += 1) await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch {}
    }
    await syncPremium({ startTrial: true });
    installAdminButton();
  }

  installAuthGuard();
  installAdminForm();
  bootPremium();
  supabaseClient?.auth.onAuthStateChange(() => setTimeout(() => syncPremium({ startTrial: true }), 250));
  setInterval(() => syncPremium({ startTrial: false }), 60000);
})();
