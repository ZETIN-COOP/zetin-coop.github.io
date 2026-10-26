(() => {
  const root = document.documentElement;
  const panels = Array.from(document.querySelectorAll('#main > section'));
  const indexLinks = Array.from(document.querySelectorAll('.section-index a'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const carousel = document.querySelector('.robot-list');
  let frame = 0;
  let activePanel = -1;

  let journeyFrame = 0;
  const journeyDurationMs = 1600;
  const panelTargets = new Map(panels.map((panel) => ['#' + (panel.id || 'top'), panel]));

  const stopJourney = () => {
    cancelAnimationFrame(journeyFrame);
    journeyFrame = 0;
    root.classList.remove('is-section-traveling');
  };
  const travelTo = (target) => {
    stopJourney();
    const start = window.scrollY;
    const destinationFor = () => target === panels[0] ? 0 : Math.max(0, window.scrollY + target.getBoundingClientRect().top - (document.querySelector('.site-header')?.offsetHeight || 68));
    const destination = destinationFor();
    root.classList.add('is-section-traveling');
    if (reducedMotion.matches || Math.abs(destination - start) < 1) {
      window.scrollTo({top:destination, behavior:'auto'});
      stopJourney();
      return;
    }
    let startedAt = null;
    const advance = (now) => {
      if (startedAt === null) startedAt = now;
      const progress = Math.min((now - startedAt) / journeyDurationMs, 1);
      const eased = (1 - Math.cos(Math.PI * progress)) / 2;
      window.scrollTo({top:start + (destinationFor() - start) * eased, behavior:'auto'});
      if (progress < 1) journeyFrame = requestAnimationFrame(advance);
      else journeyFrame = requestAnimationFrame(() => {
        window.scrollTo({top:destinationFor(), behavior:'auto'});
        stopJourney();
      });
    };
    journeyFrame = requestAnimationFrame(advance);
  };

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const updateScrollableRegions = () => {
    document.querySelectorAll('.panel-content,.robot-details').forEach((region) => {
      const scrollable = getComputedStyle(region).overflowY === 'auto' && region.scrollHeight > region.clientHeight + 4;
      region.classList.toggle('has-overflow', scrollable);
      if (scrollable) {
        region.tabIndex = 0;
        region.setAttribute('role', 'region');
        const heading = region.querySelector('h2,h3');
        const english = root.lang === 'en';
        region.setAttribute('aria-label', heading ? heading.textContent.replace(/\s+/g, ' ').trim() + (english ? ' — read more' : ' 자세히 읽기') : (english ? 'Robot project details' : '로봇 프로젝트 상세 설명'));
      } else {
        region.removeAttribute('tabindex');
        region.removeAttribute('role');
        region.removeAttribute('aria-label');
      }
    });
  };

  const render = () => {
    frame = 0;
    if (document.hidden || !panels.length) return;
    const height = window.innerHeight;
    const headerHeight = document.querySelector('.site-header')?.offsetHeight || 68;
    const center = headerHeight + (height - headerHeight) * .45;
    const measurements = panels.map((panel) => ({panel, rect: panel.getBoundingClientRect()}));
    let closest = 0;
    let distance = Infinity;
    measurements.forEach(({panel, rect}, index) => {
      const candidate = rect.top <= center && rect.bottom > center ? 0 : Math.min(Math.abs(rect.top - center), Math.abs(rect.bottom - center));
      if (candidate < distance) {
        distance = candidate;
        closest = index;
      }
      if (reducedMotion.matches) return;
      if (index === 0) {
        const progress = clamp(-rect.top / Math.max(1, rect.height));
        panel.style.setProperty('--hero-drift', (progress * -42).toFixed(2) + 'px');
        panel.style.setProperty('--hero-opacity', (1 - progress * .55).toFixed(3));
      } else {
        const progress = clamp((height - rect.top) / Math.max(1, height - headerHeight));
        const remaining = 1 - progress;
        panel.style.setProperty('--panel-lift', (remaining * 36).toFixed(2) + 'px');
        panel.style.setProperty('--panel-scale', (1 - remaining * .025).toFixed(4));
        panel.style.setProperty('--panel-edge', (remaining * 18).toFixed(2) + 'px');
        panel.style.setProperty('--panel-radius', (remaining * 24).toFixed(2) + 'px');
      }
      if (panel.id === 'robots' && carousel) {
        const progress = clamp((height - rect.top) / Math.max(1, height + rect.height));
        const amplitude = window.innerWidth <= 760 ? 4 : 12;
        carousel.style.setProperty('--image-drift', ((.5 - progress) * amplitude * 2).toFixed(2) + 'px');
      }
    });
    if (closest !== activePanel) {
      activePanel = closest;
      root.dataset.activeSection = panels[closest].id || 'top';
      indexLinks.forEach((link, index) => {
        if (index === closest) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      document.dispatchEvent(new Event('sectionchange'));
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };
  const layout = () => {

    updateScrollableRegions();
    schedule();
  };
  const syncMotionPreference = () => {
    stopJourney();
    root.classList.toggle('motion-ready', !reducedMotion.matches);
    schedule();
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = link.getAttribute('href');
    const target = panelTargets.get(hash);
    if (!target) return;
    event.preventDefault();
    if (window.location.hash !== hash) history.pushState(null, '', hash);
    travelTo(target);
  });
  window.addEventListener('wheel', stopJourney, {passive:true});
  window.addEventListener('touchstart', stopJourney, {passive:true});
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) stopJourney();
  });
  window.addEventListener('popstate', stopJourney);
  document.addEventListener('scroll', schedule, {passive:true, capture:true});
  window.addEventListener('resize', layout, {passive:true});
  window.addEventListener('pageshow', layout);
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('originintroend', layout);
  reducedMotion.addEventListener('change', syncMotionPreference);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(layout);
    document.querySelectorAll('.panel-content,.robot-list,.robot-details').forEach((element) => observer.observe(element));
  }
  if (document.fonts) document.fonts.ready.then(layout);
  syncMotionPreference();
  layout();
})();
