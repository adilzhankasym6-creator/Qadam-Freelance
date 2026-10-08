/* Qadam UI v4: стабильная загрузка, сохранение фильтров и адаптивный интерфейс. */
(() => {
  const categories = [
    { value: 'Сайты', icon: '⌘', title: 'Сайты и лендинги', note: 'Tilda, Webflow, WordPress', group: 'Разработка' },
    { value: 'Разработка', icon: '</>', title: 'Разработка и IT', note: 'Веб-сервисы и интеграции', group: 'Разработка' },
    { value: 'Мобильные приложения', icon: '▣', title: 'Мобильные приложения', note: 'Android, iOS и кроссплатформа', group: 'Разработка' },
    { value: 'Telegram-боты', icon: '➤', title: 'Telegram-боты', note: 'Боты, Mini Apps и автоматизация', group: 'Разработка' },
    { value: 'Администрирование', icon: '⚙', title: 'Администрирование', note: 'Серверы, CMS и техподдержка', group: 'Разработка' },
    { value: 'Дизайн', icon: '◇', title: 'Дизайн и брендинг', note: 'UI/UX, логотипы и фирменный стиль', group: 'Дизайн' },
    { value: 'Карточки товаров', icon: '▤', title: 'Карточки товаров', note: 'Kaspi, WB и Ozon', group: 'Дизайн' },
    { value: '3D и архитектура', icon: '◫', title: '3D и архитектура', note: 'Модели, рендеры и чертежи', group: 'Дизайн' },
    { value: 'AI-контент', icon: '✦', title: 'AI и автоматизация', note: 'Изображения, видео и процессы', group: 'Контент' },
    { value: 'Видео и анимация', icon: '▶', title: 'Видео и анимация', note: 'Монтаж, Reels и motion', group: 'Контент' },
    { value: 'Фото и ретушь', icon: '◉', title: 'Фото и ретушь', note: 'Обработка и предметные фото', group: 'Контент' },
    { value: 'Тексты и копирайтинг', icon: 'Aa', title: 'Тексты', note: 'Копирайтинг, сценарии и SEO', group: 'Контент' },
    { value: 'Переводы', icon: '文', title: 'Переводы', note: 'Русский, казахский и другие языки', group: 'Контент' },
    { value: 'Аудио и музыка', icon: '♪', title: 'Аудио и музыка', note: 'Озвучка, подкасты и звук', group: 'Контент' },
    { value: 'Маркетинг', icon: '↗', title: 'Маркетинг и реклама', note: 'Таргет, контекст и стратегия', group: 'Продвижение' },
    { value: 'SMM и контент', icon: '#', title: 'SMM и контент', note: 'Соцсети и контент-планы', group: 'Продвижение' },
    { value: 'Маркетплейсы', icon: '▦', title: 'Маркетплейсы', note: 'Kaspi, WB и Ozon под ключ', group: 'Продвижение' },
    { value: 'Бизнес и консультации', icon: '◎', title: 'Бизнес и консультации', note: 'Стратегия, финансы и продажи', group: 'Бизнес' },
    { value: 'Аналитика и данные', icon: '▥', title: 'Аналитика и данные', note: 'Excel, BI, отчёты и исследования', group: 'Бизнес' },
    { value: 'Обучение', icon: '⌁', title: 'Обучение', note: 'Репетиторы и консультации', group: 'Бизнес' },
    { value: 'Другое', icon: '•••', title: 'Другое', note: 'Другие удалённые задачи', group: 'Бизнес' }
  ];

  const popularValues = ['Сайты', 'Разработка', 'Дизайн', 'Карточки товаров', 'AI-контент', 'Маркетинг', 'SMM и контент', 'Видео и анимация'];
  const regions = [
    ['', 'Весь СНГ'],
    ['Казахстан', 'Казахстан'],
    ['Россия', 'Россия'],
    ['СНГ', 'Другие страны СНГ'],
    ['Удалённо', 'Только удалённо']
  ];
  const locationSuggestions = [
    'Казахстан · удалённо', 'Алматы', 'Астана', 'Караганда', 'Шымкент',
    'Россия · удалённо', 'Москва', 'Санкт-Петербург', 'СНГ · удалённо', 'Удалённо'
  ];
  const templates = [
    { icon: '⌘', title: 'Сайт под ключ', note: 'Лендинг или сайт компании', category: 'Сайты', jobTitle: 'Нужен современный сайт под ключ', description: 'Опишите компанию, нужные страницы, примеры сайтов, желаемый срок и материалы, которые уже готовы.', skills: 'Веб-дизайн, адаптив, верстка' },
    { icon: '▤', title: 'Карточки товаров', note: 'Kaspi, WB или Ozon', category: 'Карточки товаров', jobTitle: 'Нужно оформить карточки товаров', description: 'Укажите количество карточек, маркетплейс, стиль, наличие фотографий и какие исходники нужны в результате.', skills: 'Инфографика, Figma, маркетплейсы' },
    { icon: '↗', title: 'Продвижение', note: 'Реклама и социальные сети', category: 'Маркетинг', jobTitle: 'Нужен специалист по продвижению', description: 'Расскажите о продукте, целевой аудитории, рекламном бюджете, текущих результатах и цели продвижения.', skills: 'Маркетинг, аналитика, реклама' },
    { icon: '✦', title: 'AI-автоматизация', note: 'Боты и автоматизация задач', category: 'AI-контент', jobTitle: 'Нужно автоматизировать рабочий процесс', description: 'Опишите текущий процесс, что нужно автоматизировать, какими сервисами пользуетесь и какой результат ожидаете.', skills: 'AI, автоматизация, интеграции' }
  ];

  const htmlEscape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const categoryByValue = value => categories.find(item => item.value === value);

  function currencyFromLocation(location = '') {
    const text = String(location).toLowerCase();
    if (/росси|москв|петербург|санкт|\bрф\b|снг|узбекистан|кыргыз|беларус|армени|азербайджан|таджикистан|молдова/.test(text)) return 'RUB';
    if (/казахстан|алматы|астана|караганда|шымкент|актау|атырау|павлодар|семей|тараз|костанай|актобе|кызылорда|уральск|петропавловск|усть[- ]каменогорск/.test(text)) return 'KZT';
    return '';
  }

  function currencySymbol(code) {
    return code === 'RUB' ? '₽' : '₸';
  }

  function formatBudget(value, location = '', explicitCurrency = '') {
    const original = String(value || '').trim();
    if (!original || /договор|по итог|обсужд|не указан/i.test(original)) return original || 'Договорная';
    const markedCurrency = /(?:₽|RUB|руб(?:\.|лей|ля)?)/i.test(original)
      ? 'RUB'
      : /(?:₸|KZT|тенге)/i.test(original) ? 'KZT' : '';
    const currency = currencyFromLocation(location) || markedCurrency || explicitCurrency || 'KZT';
    const cleaned = original
      .replace(/(?:₸|₽|тенге|руб(?:\.|лей|ля)?|KZT|RUB)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!/\d/.test(cleaned)) return original;
    return `${cleaned} ${currencySymbol(currency)}`;
  }

  window.qadamFormatBudget = formatBudget;
  window.qadamCurrencyFromLocation = currencyFromLocation;
  window.qadamCategories = categories;
  if (window.__QADAM_UNIT_TEST__) return;
  document.body.classList.add('qadam-v2');
  const savedRegion = localStorage.getItem('qadam_region') || '';
  const savedSort = localStorage.getItem('qadam_sort') || 'new';
  state.region = regions.some(([value]) => value === savedRegion) ? savedRegion : '';
  state.sort = ['new', 'old'].includes(savedSort) ? savedSort : 'new';

  function chooseCategory(value) {
    state.category = value || '';
    document.querySelectorAll('[data-q-category]').forEach(node => {
      node.classList.toggle('active', (node.dataset.qCategory || '') === state.category);
    });
    document.querySelectorAll('[data-category]').forEach(node => {
      node.classList.toggle('active', (node.dataset.category || '') === state.category);
    });
    document.querySelector('#categoryModal')?.classList.remove('open');
    setView('catalog');
    render();
    document.querySelector('#jobList')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderCategoryTiles() {
    return popularValues.map(value => {
      const item = categoryByValue(value);
      return `<button class="category-tile${state.category === value ? ' active' : ''}" data-q-category="${htmlEscape(value)}">
        <span class="category-icon">${item.icon}</span>
        <span><strong>${htmlEscape(item.title)}</strong><small>${htmlEscape(item.note)}</small></span>
      </button>`;
    }).join('');
  }

  function categoryOptions(selected = '') {
    const groups = [...new Set(categories.map(item => item.group))];
    return groups.map(group => `<optgroup label="${htmlEscape(group)}">${categories
      .filter(item => item.group === group)
      .map(item => `<option value="${htmlEscape(item.value)}"${item.value === selected ? ' selected' : ''}>${htmlEscape(item.title)}</option>`)
      .join('')}</optgroup>`).join('');
  }

  function installHero() {
    const catalog = document.querySelector('#view-catalog');
    const feedHead = catalog?.querySelector('.feed-head');
    if (!catalog || !feedHead || document.querySelector('.market-hero')) return;
    feedHead.insertAdjacentHTML('beforebegin', `
      <section class="market-hero">
        <div class="hero-copy">
          <div class="hero-eyebrow">Фриланс для Казахстана и СНГ</div>
          <h1>Найдите специалиста.<br><span>Начните сегодня.</span></h1>
          <p>Опубликуйте задачу бесплатно, сравните предложения и общайтесь с исполнителем напрямую.</p>
          <div class="hero-actions">
            <button class="btn hero-primary" id="heroPublish">Разместить задачу</button>
            <button class="btn hero-secondary" id="heroBrowse">Смотреть заказы</button>
          </div>
        </div>
        <div class="hero-trust"><span>Публикация бесплатно</span><span>Прямой контакт</span><span>Проверяемые профили</span></div>
      </section>`);
    document.querySelector('#heroPublish').onclick = () => document.querySelector('#openPublish')?.click();
    document.querySelector('#heroBrowse').onclick = () => document.querySelector('#jobList')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    feedHead.querySelector('h1').textContent = 'Свежие заказы';
    feedHead.querySelector('p').textContent = 'Новые задачи от заказчиков — без лишних посредников';
  }

  function installCategoryHub() {
    const feedHead = document.querySelector('#view-catalog .feed-head');
    if (!feedHead || document.querySelector('.category-hub')) return;
    feedHead.insertAdjacentHTML('beforebegin', `
      <section class="category-hub">
        <div class="section-heading"><div><h2>Популярные направления</h2><p>Выберите сферу — покажем подходящие заказы</p></div><button class="all-categories-btn" id="openCategories">Все категории →</button></div>
        <div class="category-grid" id="categoryGrid">${renderCategoryTiles()}</div>
      </section>`);
    document.querySelector('#openCategories').onclick = () => document.querySelector('#categoryModal')?.classList.add('open');
  }

  function installCategoryModal() {
    if (document.querySelector('#categoryModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-bg" id="categoryModal"><div class="modal modal-wide">
        <header class="modal-head"><div><h2>Все категории</h2><p>Найдите нужное направление</p></div><button class="close" data-category-close>×</button></header>
        <div class="modal-body">
          <label class="category-modal-search"><input id="categorySearch" placeholder="Поиск категории"></label>
          <div class="category-modal-grid" id="categoryModalGrid"></div>
        </div>
      </div></div>`);
    const draw = query => {
      const needle = String(query || '').trim().toLowerCase();
      const visible = categories.filter(item => !needle || `${item.title} ${item.note} ${item.value}`.toLowerCase().includes(needle));
      document.querySelector('#categoryModalGrid').innerHTML = `
        <button class="category-modal-item" data-q-category=""><span>⌂</span><span><strong>Все заказы</strong><small>Без фильтра по категории</small></span></button>
        ${visible.map(item => `<button class="category-modal-item" data-q-category="${htmlEscape(item.value)}"><span>${item.icon}</span><span><strong>${htmlEscape(item.title)}</strong><small>${htmlEscape(item.note)}</small></span></button>`).join('')}`;
      bindCategoryButtons();
    };
    draw('');
    document.querySelector('#categorySearch').oninput = event => draw(event.target.value);
    document.querySelector('[data-category-close]').onclick = () => document.querySelector('#categoryModal').classList.remove('open');
    document.querySelector('#categoryModal').onclick = event => {
      if (event.target.id === 'categoryModal') event.currentTarget.classList.remove('open');
    };
  }

  function bindCategoryButtons() {
    document.querySelectorAll('[data-q-category]').forEach(button => {
      button.onclick = () => chooseCategory(button.dataset.qCategory || '');
    });
  }

  function rebuildNavigation() {
    const categoryButtons = document.querySelectorAll('.side-nav [data-category]');
    categoryButtons.forEach(button => button.remove());
    const nav = document.querySelector('.side-nav');
    const divider = nav?.querySelector('.side-divider');
    if (nav && divider && !nav.querySelector('.q-side-categories')) {
      divider.insertAdjacentHTML('afterend', `<div class="side-title q-side-categories">Категории</div>${popularValues.slice(0, 5).map(value => {
        const item = categoryByValue(value);
        return `<button data-q-category="${htmlEscape(value)}"><span class="side-icon">${item.icon}</span>${htmlEscape(item.title)}</button>`;
      }).join('')}<button id="sideAllCategories"><span class="side-icon">•••</span>Все категории</button>`);
      document.querySelector('#sideAllCategories').onclick = () => document.querySelector('#categoryModal')?.classList.add('open');
    }

    const icons = { catalog: '⌕', mine: '▤', bids: '↗', saved: '☆', profile: '○', admin: '⚙' };
    document.querySelectorAll('.side-nav [data-view]').forEach(button => {
      if (!button.querySelector('.side-icon')) button.insertAdjacentHTML('afterbegin', `<span class="side-icon">${icons[button.dataset.view] || '•'}</span>`);
    });

    const mobile = document.querySelector('.mobile-tabs');
    if (mobile) {
      mobile.innerHTML = `
        <button class="active" data-view="catalog">Заказы</button>
        <button data-view="bids">Отклики</button>
        <button class="mobile-publish" id="mobilePublishV2" aria-label="Разместить объявление">Разместить</button>
        <button data-view="saved">Избранное</button>
        <button data-view="profile">Профиль</button>`;
      mobile.querySelectorAll('[data-view]').forEach(button => button.onclick = event => {
        event.preventDefault();
        setView(button.dataset.view);
      });
      document.querySelector('#mobilePublishV2').onclick = () => document.querySelector('#openPublish')?.click();
    }
    bindCategoryButtons();
  }

  function rebuildRegionFilter() {
    const select = document.querySelector('#city');
    if (!select) return;
    select.innerHTML = regions.map(([value, title]) => `<option value="${htmlEscape(value)}">${htmlEscape(title)}</option>`).join('');
    select.value = state.region;
    select.onchange = () => {
      state.region = select.value;
      localStorage.setItem('qadam_region', state.region);
      const mobileSelect = document.querySelector('#mobileRegion');
      if (mobileSelect) mobileSelect.value = state.region;
      render();
    };
  }

  function installMobileFilters() {
    const feedHead = document.querySelector('#view-catalog .feed-head');
    if (!feedHead || document.querySelector('.mobile-filter-bar')) return;
    feedHead.insertAdjacentHTML('afterend', `
      <div class="mobile-filter-bar" aria-label="Фильтры заказов">
        <label><span>Регион</span><select id="mobileRegion">${regions.map(([value, title]) => `<option value="${htmlEscape(value)}">${htmlEscape(title)}</option>`).join('')}</select></label>
        <label><span>Сортировка</span><select id="mobileSort"><option value="new">Сначала новые</option><option value="old">Сначала старые</option></select></label>
      </div>`);
    const regionSelect = document.querySelector('#mobileRegion');
    const sortSelect = document.querySelector('#mobileSort');
    regionSelect.value = state.region;
    sortSelect.value = state.sort;
    regionSelect.onchange = () => {
      state.region = regionSelect.value;
      localStorage.setItem('qadam_region', state.region);
      const desktopSelect = document.querySelector('#city');
      if (desktopSelect) desktopSelect.value = state.region;
      render();
    };
    sortSelect.onchange = () => {
      state.sort = sortSelect.value;
      localStorage.setItem('qadam_sort', state.sort);
      const desktopSort = document.querySelector('.feed-controls select');
      if (desktopSort) desktopSort.value = state.sort;
      render();
    };
  }

  function matchesRegion(location, region) {
    if (!region) return true;
    const text = String(location || '').toLowerCase();
    if (region === 'Казахстан') return /казахстан|алматы|астана|караганда|шымкент|актау|атырау|павлодар|семей|тараз/.test(text);
    if (region === 'Россия') return /росси|москв|петербург|санкт|\bрф\b/.test(text);
    if (region === 'СНГ') return /снг|узбекистан|кыргыз|беларус|армени|азербайджан|таджикистан|молдова/.test(text);
    if (region === 'Удалённо') return /удал[её]н/.test(text);
    return true;
  }
  window.qadamMatchesRegion = matchesRegion;

  function enhanceSort() {
    const select = document.querySelector('.feed-controls select');
    if (!select) return;
    select.innerHTML = '<option value="new">Сначала новые</option><option value="old">Сначала старые</option>';
    select.value = state.sort;
    select.onchange = () => {
      state.sort = select.value;
      localStorage.setItem('qadam_sort', state.sort);
      const mobileSort = document.querySelector('#mobileSort');
      if (mobileSort) mobileSort.value = state.sort;
      render();
    };
  }

  function enhanceForm(form, options = {}) {
    if (!form || form.dataset.qEnhanced) return;
    form.dataset.qEnhanced = '1';
    const category = form.elements.category;
    if (category) category.innerHTML = categoryOptions(category.value);

    const location = form.elements.location;
    if (location) {
      location.setAttribute('list', 'qadamRegions');
      location.placeholder = 'Например, Казахстан · удалённо';
      if (!location.value || location.value === 'Удалённо') location.value = 'Казахстан · удалённо';
      location.defaultValue = location.value;
      location.insertAdjacentHTML('afterend', '<small class="region-list-note">Регион определяет валюту объявления</small>');
    }

    const budget = form.elements.budget || form.elements.price;
    if (budget) {
      budget.placeholder = 'Например, 80 000';
      budget.inputMode = 'numeric';
      const wrapper = document.createElement('div');
      wrapper.className = 'budget-control';
      budget.parentNode.insertBefore(wrapper, budget);
      wrapper.appendChild(budget);
      const currency = document.createElement('select');
      currency.className = 'currency-select';
      currency.name = 'currency_ui';
      currency.setAttribute('aria-label', 'Валюта');
      currency.innerHTML = '<option value="KZT">₸ KZT</option><option value="RUB">₽ RUB</option>';
      wrapper.appendChild(currency);

      const syncCurrency = force => {
        const inferred = currencyFromLocation(location?.value || options.location || '');
        if (inferred) {
          currency.value = inferred;
          currency.disabled = true;
          currency.title = 'Валюта определена по региону';
        } else {
          currency.disabled = false;
          currency.title = 'Выберите валюту для удалённого заказа';
          if (force || !currency.dataset.touched) currency.value = currency.value || 'KZT';
        }
      };
      form.qadamSyncCurrency = syncCurrency;
      syncCurrency(true);
      location?.addEventListener('input', () => syncCurrency(false));
      location?.addEventListener('change', () => syncCurrency(false));
      currency.addEventListener('change', () => { currency.dataset.touched = '1'; });
      const modal = form.closest('.modal-bg');
      if (modal) new MutationObserver(() => {
        if (modal.classList.contains('open')) syncCurrency(true);
      }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function installRegionsList() {
    if (document.querySelector('#qadamRegions')) return;
    document.body.insertAdjacentHTML('beforeend', `<datalist id="qadamRegions">${locationSuggestions.map(value => `<option value="${htmlEscape(value)}"></option>`).join('')}</datalist>`);
  }

  function normalizeFormMoney(form) {
    const input = form?.elements?.budget || form?.elements?.price;
    const currency = form?.elements?.currency_ui?.value || currencyFromLocation(form?.elements?.location?.value || '');
    if (input) input.value = formatBudget(input.value, form?.elements?.location?.value || '', currency);
  }

  function installMoneyHandlers() {
    document.addEventListener('submit', event => {
      if (['publishForm', 'externalJobForm', 'bidForm'].includes(event.target.id)) normalizeFormMoney(event.target);
    }, true);

    if (typeof card === 'function' && !card.qCurrencyWrapped) {
      const previousCard = card;
      card = function (job) {
        return previousCard({ ...job, budget: formatBudget(job.budget, job.location, job.currency) });
      };
      card.qCurrencyWrapped = true;
    }
    if (typeof ownCard === 'function' && !ownCard.qCurrencyWrapped) {
      const previousOwnCard = ownCard;
      ownCard = function (job) {
        return previousOwnCard({ ...job, budget: formatBudget(job.budget, job.location, job.currency) });
      };
      ownCard.qCurrencyWrapped = true;
    }
  }

  function installDialogEnhancements() {
    if (typeof editJob === 'function' && !editJob.qUiWrapped) {
      const previousEditJob = editJob;
      editJob = function (jobId) {
        const result = previousEditJob(jobId);
        const job = state.jobs.find(item => String(item.id) === String(jobId));
        const form = document.querySelector('#publishForm');
        if (job && form?.elements?.currency_ui) {
          form.elements.currency_ui.dataset.touched = '';
          form.qadamSyncCurrency?.(true);
          if (!currencyFromLocation(job.location)) form.elements.currency_ui.value = job.currency || 'KZT';
          form.elements.budget.value = String(job.budget || '').replace(/(?:₸|₽|тенге|руб(?:\.|лей|ля)?|KZT|RUB)/gi, '').trim();
        }
        return result;
      };
      editJob.qUiWrapped = true;
    }

    if (typeof openBid === 'function' && !openBid.qUiWrapped) {
      const previousOpenBid = openBid;
      openBid = async function (jobId) {
        const result = await previousOpenBid(jobId);
        const job = state.jobs.find(item => String(item.id) === String(jobId));
        const form = document.querySelector('#bidForm');
        if (job && form?.elements?.currency_ui) {
          form.elements.currency_ui.value = job.currency || currencyFromLocation(job.location);
          form.elements.currency_ui.dataset.touched = '';
        }
        return result;
      };
      openBid.qUiWrapped = true;
    }
  }

  function installClientStudio() {
    const catalog = document.querySelector('#view-catalog');
    const about = catalog?.querySelector('section[style*="margin-top:28px"]');
    if (!catalog || document.querySelector('.client-studio')) return;
    const html = `<section class="client-studio">
      <div class="client-studio-head"><div><h2>Задача есть, а ТЗ ещё нет?</h2><p>Выберите шаблон — мы подскажем, что написать исполнителю.</p></div></div>
      <div class="template-grid">${templates.map((item, index) => `<button class="template-card" data-template="${index}"><span>${item.icon}</span><strong>${htmlEscape(item.title)}</strong><small>${htmlEscape(item.note)}</small></button>`).join('')}</div>
    </section>`;
    if (about) about.insertAdjacentHTML('beforebegin', html);
    else catalog.insertAdjacentHTML('beforeend', html);
    document.querySelectorAll('[data-template]').forEach(button => button.onclick = () => selectTemplate(Number(button.dataset.template)));
  }

  function selectTemplate(index) {
    const item = templates[index];
    if (!item) return;
    localStorage.setItem('qadam_pending_template', JSON.stringify(item));
    document.querySelector('#openPublish')?.click();
    setTimeout(applyPendingTemplate, 50);
  }

  function applyPendingTemplate() {
    const modal = document.querySelector('#publishModal');
    const form = document.querySelector('#publishForm');
    if (!modal?.classList.contains('open') || !form) return;
    let item;
    try { item = JSON.parse(localStorage.getItem('qadam_pending_template') || 'null'); } catch { item = null; }
    if (!item) return;
    form.elements.title.value = item.jobTitle || '';
    form.elements.category.value = item.category || 'Другое';
    form.elements.description.value = item.description || '';
    form.elements.skills.value = item.skills || '';
    localStorage.removeItem('qadam_pending_template');
    form.elements.budget?.focus();
    toast('Шаблон заполнен — добавьте бюджет и детали');
  }

  function installClientSideCard() {
    const rightbar = document.querySelector('.rightbar');
    if (!rightbar || document.querySelector('.client-side-card')) return;
    rightbar.insertAdjacentHTML('afterbegin', `<section class="client-side-card"><h3>Нужен исполнитель?</h3><p>Опишите задачу — специалисты предложат цену и срок.</p><button class="btn" id="sidePublish">Разместить бесплатно</button></section>`);
    document.querySelector('#sidePublish').onclick = () => document.querySelector('#openPublish')?.click();
  }

  function updateCategoryState() {
    const grid = document.querySelector('#categoryGrid');
    if (grid) grid.innerHTML = renderCategoryTiles();
    bindCategoryButtons();
    document.querySelectorAll('[data-q-category]').forEach(node => node.classList.toggle('active', (node.dataset.qCategory || '') === state.category));
  }

  function syncExternalCards() {
    document.querySelectorAll('.external-job').forEach(job => {
      const location = job.querySelector('.reply-count')?.textContent?.split('·')[0]?.trim() || '';
      const budget = job.querySelector('.budget');
      if (budget) budget.textContent = formatBudget(budget.textContent, location);
      job.hidden = !matchesRegion(location, state.region || '');
    });
  }

  function postRender() {
    updateCategoryState();
    const feedTitle = document.querySelector('#view-catalog .feed-head h1');
    if (feedTitle) feedTitle.textContent = state.category
      ? (categoryByValue(state.category)?.title || state.category)
      : 'Свежие заказы';
    syncExternalCards();
    document.querySelectorAll('.mobile-tabs [data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === state.view));
    applyPendingTemplate();
  }

  function installRenderEnhancements() {
    if (typeof filtered === 'function' && !filtered.qRegionWrapped) {
      const previousFiltered = filtered;
      filtered = function () {
        const rows = previousFiltered().filter(job => matchesRegion(job.location, state.region || ''));
        return rows.slice().sort((a, b) => state.sort === 'old'
          ? new Date(a.created_at) - new Date(b.created_at)
          : new Date(b.created_at) - new Date(a.created_at));
      };
      filtered.qRegionWrapped = true;
    }
    if (typeof render === 'function' && !render.qUiWrapped) {
      const previousRender = render;
      render = function () {
        previousRender();
        postRender();
      };
      render.qUiWrapped = true;
    }
  }

  function readJobsCache() {
    try {
      const cached = JSON.parse(localStorage.getItem('qadam_jobs_cache_v4') || '[]');
      return Array.isArray(cached) ? cached : [];
    } catch {
      return [];
    }
  }

  function writeJobsCache(rows) {
    try { localStorage.setItem('qadam_jobs_cache_v4', JSON.stringify(rows)); } catch {}
  }

  async function withRetry(request, attempts = 2) {
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try { return await request(); }
      catch (error) {
        lastError = error;
        if (attempt + 1 < attempts) await new Promise(resolve => setTimeout(resolve, 350));
      }
    }
    throw lastError;
  }

  function installStableJobsLoader() {
    const cached = readJobsCache();
    if (!state.jobs.length && cached.length) state.jobs = cached;
    if (typeof load !== 'function' || load.qStableLoader) return;
    let sequence = 0;
    let errorShown = false;
    load = async function () {
      if (!configured()) {
        state.jobs = cached.length ? cached : demoJobs;
        render();
        return;
      }
      const requestId = ++sequence;
      try {
        const rows = await withRetry(() => api('jobs?select=*&order=created_at.desc'));
        if (requestId !== sequence) return;
        const ownerIds = [...new Set((rows || []).map(item => item.owner_id).filter(Boolean))];
        let people = [];
        if (ownerIds.length) {
          people = await withRetry(() => api(`profiles?id=in.(${ownerIds.join(',')})&select=id,display_name,telegram_username,avatar_url,role,bio,skills`))
            .catch(() => api(`profiles?id=in.(${ownerIds.join(',')})&select=id,display_name,telegram_username`));
        }
        if (requestId !== sequence) return;
        const profileMap = Object.fromEntries((people || []).map(person => [person.id, person]));
        state.jobs = (rows || []).map(row => {
          const profile = profileMap[row.owner_id] || {};
          return {
            ...row,
            profiles: profile,
            author: profile.display_name || 'Пользователь Qadam',
            telegram_username: row.telegram_username || profile.telegram_username || '',
            avatar_url: profile.avatar_url || ''
          };
        });
        writeJobsCache(state.jobs);
        errorShown = false;
        if (typeof loadProfileExtras === 'function') await loadProfileExtras().catch(() => {});
      } catch (error) {
        console.warn('Jobs load:', error);
        const fallback = readJobsCache();
        if (!state.jobs.length && fallback.length) state.jobs = fallback;
        if (!errorShown) {
          toast(fallback.length ? 'Связь восстановится автоматически — показаны последние данные' : 'Не удалось загрузить объявления. Проверьте интернет и обновите страницу');
          errorShown = true;
        }
      }
      render();
    };
    load.qStableLoader = true;
    window.addEventListener('online', () => load());
  }

  function polishExistingContent() {
    document.querySelector('#search')?.setAttribute('placeholder', 'Поиск заказов, навыков и услуг');
    const logoText = document.querySelector('.logo > span:last-child');
    if (logoText) logoText.textContent = 'Qadam';
    const about = document.querySelector('#view-catalog>section[style*="margin-top:28px"]');
    if (about) about.classList.add('about-qadam');
  }

  function start() {
    installStableJobsLoader();
    installRegionsList();
    installCategoryModal();
    installHero();
    installCategoryHub();
    rebuildNavigation();
    rebuildRegionFilter();
    enhanceSort();
    installMobileFilters();
    enhanceForm(document.querySelector('#publishForm'));
    enhanceForm(document.querySelector('#externalJobForm'));
    enhanceForm(document.querySelector('#bidForm'));
    installMoneyHandlers();
    installDialogEnhancements();
    installClientStudio();
    installClientSideCard();
    installRenderEnhancements();
    polishExistingContent();

    const publishModal = document.querySelector('#publishModal');
    if (publishModal) new MutationObserver(applyPendingTemplate).observe(publishModal, { attributes: true, attributeFilter: ['class'] });
    const jobList = document.querySelector('#jobList');
    if (jobList) new MutationObserver(syncExternalCards).observe(jobList, { childList: true });
    render();
  }

  start();
})();
