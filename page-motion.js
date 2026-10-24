(() => {
  const root = document.documentElement;
  const panels = Array.from(document.querySelectorAll('#main > section'));
  const indexLinks = Array.from(document.querySelectorAll('.section-index a'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const carousel = document.querySelector('.robot-list');
  let frame = 0;
  let activePanel = -1;
  let cardWidth = 0;

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const updateCardWidth = () => {
    if (!carousel) return;
    const width = carousel.clientWidth;
    if (width <= 0 || Math.abs(width - cardWidth) < .5) return;
    cardWidth = width;
    carousel.dispatchEvent(new Event('carousel:layout'));
  };

  const updateScrollableRegions = () => {
    document.querySelectorAll('.panel-content,.robot-details').forEach((region) => {
      const scrollable = getComputedStyle(region).overflowY === 'auto' && region.scrollHeight > region.clientHeight + 4;
      region.classList.toggle('has-overflow', scrollable);
      if (scrollable) {
        region.tabIndex = 0;
        region.setAttribute('role', 'region');
        const heading = region.querySelector('h2,h3');
        region.setAttribute('aria-label', heading ? heading.textContent.replace(/\s+/g, ' ').trim() + ' 자세히 읽기' : '로봇 프로젝트 상세 설명');
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
      indexLinks.forEach((link, index) => {
        if (index === closest) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };
  const layout = () => {
    updateCardWidth();
    updateScrollableRegions();
    schedule();
  };
  const syncMotionPreference = () => {
    root.classList.toggle('motion-ready', !reducedMotion.matches);
    schedule();
  };

  document.addEventListener('scroll', schedule, {passive:true, capture:true});
  window.addEventListener('resize', layout, {passive:true});
  window.addEventListener('pageshow', layout);
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', syncMotionPreference);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(layout);
    document.querySelectorAll('.panel-content,.robot-list,.robot-details').forEach((element) => observer.observe(element));
  }
  if (document.fonts) document.fonts.ready.then(layout);
  syncMotionPreference();
  layout();
})();
