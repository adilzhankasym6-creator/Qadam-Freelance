/* Safe no-op in a browser; enables native Android integration inside the Qadam app. */
(() => {
  const bridge = window.QadamAndroid;
  window.QADAM_NATIVE = !!bridge;
  if (!bridge) return;

  window.QADAM_AUTH_REDIRECT = 'qadam://login-callback';
  const originalOpen = window.open.bind(window);
  window.open = function(url, target, features) {
    if (typeof url === 'string' && /^(https?:|tg:)/i.test(url)) {
      bridge.openExternal(url);
      return null;
    }
    return originalOpen(url, target, features);
  };

  window.QadamNativeBack = function() {
    const modal = document.querySelector('.modal-bg.open');
    if (modal && modal.id !== 'usernameGate') {
      modal.querySelector('[data-close], .close')?.click();
      return true;
    }
    const active = document.querySelector('.view.active');
    if (active && active.id !== 'view-catalog') {
      document.querySelector('[data-view="catalog"]')?.click();
      return true;
    }
    return false;
  };
  document.documentElement.classList.add('qadam-native');
})();
