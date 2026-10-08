/* Qadam Freelance: внешние Telegram-заказы. Подключить после основного script. */
(() => {
  const readExternalCache = () => {
    try {
      const rows = JSON.parse(localStorage.getItem('qadam_external_jobs_cache_v4') || '[]');
      const now = Date.now();
      return Array.isArray(rows) ? rows.filter(row => !row.expires_at || new Date(row.expires_at).getTime() > now) : [];
    } catch { return []; }
  };
  const externalState = { rows: readExternalCache(), loaded: false };
  const categories = [
    'Сайты','Разработка','Мобильные приложения','Telegram-боты','Администрирование',
    'Дизайн','Карточки товаров','3D и архитектура','AI-контент','Видео и анимация',
    'Фото и ретушь','Тексты и копирайтинг','Переводы','Аудио и музыка','Маркетинг',
    'SMM и контент','Маркетплейсы','Бизнес и консультации','Аналитика и данные','Обучение','Другое'
  ];

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

  const cleanUsername = value => String(value || '').trim().replace(/^@/, '');
  const validTelegram = value => /^[A-Za-z0-9_]{5,32}$/.test(cleanUsername(value));
  const sourceIsTelegram = value => {
    try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 't.me'; }
    catch { return false; }
  };

  function card(row) {
    const username = cleanUsername(row.telegram_username);
    const source = String(row.source_url || '');
    const shownBudget = window.qadamFormatBudget
      ? window.qadamFormatBudget(row.budget, row.location, row.currency)
      : row.budget;
    const adminDelete = state.profile?.is_admin
      ? `<button class="btn btn-danger" data-delete-external="${esc(row.id)}">Удалить</button>`
      : '';
    return `<article class="job external-job" data-external-category="${esc(row.category)}" data-external-search="${esc(`${row.title} ${row.description} ${(row.skills || []).join(' ')}`.toLowerCase())}">
      <div class="job-body">
        <div class="job-top">
          <span class="tag">${esc(row.category)}</span>
          <span class="tag tag-new">Из Telegram</span>
          <span class="job-time">до ${new Date(row.expires_at).toLocaleDateString('ru-RU')}</span>
        </div>
        <h2>${esc(row.title)}</h2>
        <p>${esc(row.description)}</p>
        <div class="skills">${(row.skills || []).map(item => `<span>${esc(item)}</span>`).join('')}</div>
        <div class="author">
          <span class="author-pic">T</span>
          <div><strong>${esc(row.source_name || 'Telegram')}</strong><small>Внешний заказ · контакт не проверен Qadam</small></div>
        </div>
      </div>
      <aside class="job-side">
        <div><span class="budget-label">Бюджет</span><strong class="budget">${esc(shownBudget)}</strong></div>
        <div class="job-actions">
          <a class="btn btn-primary" href="https://t.me/${encodeURIComponent(username)}" target="_blank" rel="noopener">Написать заказчику</a>
          <a class="btn" href="${esc(source)}" target="_blank" rel="noopener">Оригинал объявления</a>
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
    const total = internalCount + externalState.rows.length;
    const all = document.querySelector('#allCount');
    const side = document.querySelector('#sideCount');
    if (all) all.textContent = String(total);
    if (side) side.textContent = String(total);
  }

  function renderExternal() {
    document.querySelectorAll('.external-job').forEach(node => node.remove());
    const list = document.querySelector('#jobList');
    if (!list) return;
    const query = String(document.querySelector('#search')?.value || '').trim().toLowerCase();
    const category = state.category || '';
    const region = String(document.querySelector('#city')?.value || '');
    const visible = externalState.rows.filter(row =>
      (!category || row.category === category) &&
      (!region || !window.qadamMatchesRegion || window.qadamMatchesRegion(row.location, region)) &&
      (!query || `${row.title} ${row.description} ${(row.skills || []).join(' ')}`.toLowerCase().includes(query))
    );
    if (visible.length) {
      if (!list.querySelector('.job')) list.querySelector('.empty')?.remove();
      list.insertAdjacentHTML('beforeend', visible.map(card).join(''));
    }
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
    updateCombinedCounts();
  }

  async function loadExternal() {
    let lastError;
    try {
      let rows;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          rows = await api(`external_jobs?select=*&status=eq.active&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&order=created_at.desc`);
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
          if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 350));
        }
      }
      if (lastError) throw lastError;
      externalState.rows = Array.isArray(rows) ? rows : [];
      externalState.loaded = true;
      try { localStorage.setItem('qadam_external_jobs_cache_v4', JSON.stringify(externalState.rows)); } catch {}
    } catch (error) {
      console.warn('External jobs:', error.message);
      externalState.rows = externalState.rows.length ? externalState.rows : readExternalCache();
    }
    renderExternal();
  }

  function installAdminForm() {
    if (document.querySelector('#externalJobModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-bg" id="externalJobModal"><div class="modal">
        <header class="modal-head"><div><h2>Внешний заказ из Telegram</h2><p>Показывается 7 дней, без внутренних откликов</p></div><button class="close" data-external-close>×</button></header>
        <form class="modal-body" id="externalJobForm">
          <div class="section-note">Публикуйте только краткий пересказ свежего объявления. Нужны разрешение автора и ссылка на оригинал.</div>
          <div class="form-grid">
            <div class="field full"><label>Название</label><input name="title" minlength="8" maxlength="100" required></div>
            <div class="field"><label>Категория</label><select name="category">${categories.map(item => `<option>${item}</option>`).join('')}</select></div>
            <div class="field"><label>Бюджет</label><input name="budget" maxlength="40" required placeholder="Например, 80 000 ₸"></div>
            <div class="field"><label>Telegram заказчика</label><input name="telegram_username" required placeholder="username без @"></div>
            <div class="field"><label>Город / формат</label><input name="location" value="Удалённо"></div>
            <div class="field full"><label>Ссылка на оригинальный пост</label><input name="source_url" type="url" required placeholder="https://t.me/channel/123"></div>
            <div class="field full"><label>Название источника</label><input name="source_name" maxlength="80" required placeholder="Название Telegram-канала"></div>
            <div class="field full"><label>Краткий пересказ</label><textarea name="description" minlength="30" maxlength="1000" rows="6" required></textarea></div>
            <div class="field full"><label>Навыки через запятую</label><input name="skills" placeholder="Figma, Webflow, адаптив"></div>
            <label class="full" style="display:flex;gap:9px;align-items:flex-start;font-size:13px;line-height:1.45"><input name="permission" type="checkbox" required style="margin-top:3px"> Я получил разрешение автора на размещение и не копирую личные данные без согласия.</label>
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
      const username = cleanUsername(form.get('telegram_username'));
      const sourceUrl = String(form.get('source_url') || '').trim();
      if (!validTelegram(username)) return toast('Проверьте Telegram username');
      if (!sourceIsTelegram(sourceUrl)) return toast('Нужна ссылка вида https://t.me/...');
      const row = {
        created_by: state.user.id,
        title: String(form.get('title') || '').trim(),
        category: String(form.get('category') || ''),
        description: String(form.get('description') || '').trim(),
        budget: String(form.get('budget') || '').trim(),
        location: String(form.get('location') || '').trim() || 'Удалённо',
        skills: String(form.get('skills') || '').split(',').map(item => item.trim()).filter(Boolean).slice(0, 20),
        telegram_username: username,
        source_url: sourceUrl,
        source_name: String(form.get('source_name') || '').trim(),
        permission_confirmed: true,
        status: 'active',
        expires_at: new Date(Date.now() + 7 * 864e5).toISOString()
      };
      try {
        await api('external_jobs', { method: 'POST', body: JSON.stringify(row) });
        event.target.reset();
        document.querySelector('#externalJobModal').classList.remove('open');
        await loadExternal();
        setView('catalog');
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

  installAuthGuard();
  installAdminForm();
  loadExternal().then(installAdminButton);
})();
