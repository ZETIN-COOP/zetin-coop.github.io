const supported = new Set(['ko', 'en']);

export function resolveLanguage(pageLanguage, requestedLanguage, storedLanguage) {
  if (supported.has(requestedLanguage)) return requestedLanguage;
  if (pageLanguage === 'en') return 'en';
  return supported.has(storedLanguage) ? storedLanguage : 'ko';
}

export function localizedUrl(currentUrl, language, baseUrl) {
  const current = new URL(currentUrl);
  const target = new URL(language === 'en' ? 'en/' : './', baseUrl);
  target.search = current.search;
  target.searchParams.delete('lang');
  if (language !== 'en') target.searchParams.set('lang', 'ko');
  target.hash = current.hash;
  return target.href;
}

if (typeof document !== 'undefined') {
  const key = 'zetin-language';
  const pageLanguage = document.documentElement.lang;
  const current = new URL(window.location.href);
  const base = new URL('.', import.meta.url);
  let saved = null;
  try { saved = localStorage.getItem(key); } catch { /* Language links still work without storage. */ }
  const language = resolveLanguage(pageLanguage, current.searchParams.get('lang'), saved);
  try { localStorage.setItem(key, language); } catch { /* Storage is optional. */ }
  if (language !== pageLanguage) {
    window.location.replace(localizedUrl(current, language, base));
  } else {
    if (current.searchParams.has('lang')) {
      current.searchParams.delete('lang');
      history.replaceState(history.state, '', current);
    }
    const sectionHashes = new Set(Array.from(document.querySelectorAll('.section-index a'), (link) => link.getAttribute('href')));
    let pendingSection = sectionHashes.has(window.location.hash) ? window.location.hash : null;
    const updateLinks = () => {
      const visibleLocation = new URL(window.location.href);
      const visibleSection = document.documentElement.dataset.activeSection;
      if (pendingSection === '#' + visibleSection) pendingSection = null;
      if (pendingSection) visibleLocation.hash = pendingSection;
      else if (visibleSection) visibleLocation.hash = '#' + visibleSection;
      document.querySelectorAll('[data-language]').forEach((link) => {
        const code = link.dataset.language;
        link.href = localizedUrl(visibleLocation, code, base);
        if (code === pageLanguage) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    };
    updateLinks();
    const syncHistory = () => {
      pendingSection = sectionHashes.has(window.location.hash) ? window.location.hash : null;
      updateLinks();
    };
    const useVisibleSection = () => { pendingSection = null; updateLinks(); };
    window.addEventListener('hashchange', syncHistory);
    window.addEventListener('popstate', syncHistory);
    window.addEventListener('wheel', useVisibleSection, {passive:true});
    window.addEventListener('touchmove', useVisibleSection, {passive:true});
    window.addEventListener('keydown', (event) => {
      if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) useVisibleSection();
    });
    document.addEventListener('click', (event) => {
      const href = event.target.closest('a')?.getAttribute('href');
      if (sectionHashes.has(href)) { pendingSection = href; updateLinks(); }
    });
    document.addEventListener('sectionchange', updateLinks);
    // Section navigation uses pushState, so refresh before the pointer or keyboard activates a switch.
    document.querySelector('.language-switch')?.addEventListener('pointerover', updateLinks);
    document.querySelector('.language-switch')?.addEventListener('focusin', updateLinks);
    document.querySelectorAll('[data-language]').forEach((link) => {
      link.addEventListener('click', () => {
        updateLinks();
        try { localStorage.setItem(key, link.dataset.language); } catch { /* Keep native link navigation. */ }
      });
    });
  }
}
