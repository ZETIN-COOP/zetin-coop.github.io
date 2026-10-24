const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('.mobile-nav');

const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 20);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

if (menuButton && mobileNav) {
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '메뉴 열기');
    mobileNav.hidden = true;
    document.body.classList.remove('menu-open');
  };

  menuButton.addEventListener('click', () => {
    const opening = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', opening ? '메뉴 닫기' : '메뉴 열기');
    mobileNav.hidden = !opening;
    document.body.classList.toggle('menu-open', opening);
  });

  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 760) closeMenu(); });
}

const robotList = document.querySelector('.robot-marquee');
const marqueeToggle = document.querySelector('.marquee-toggle');
if (robotList && marqueeToggle) {
  const projects = [...robotList.querySelectorAll(':scope > .robot-row')];
  const track = document.createElement('div');
  track.className = 'robot-track';
  const group = document.createElement('div');
  group.className = 'robot-marquee-group';
  group.setAttribute('role', 'list');
  projects.forEach((project) => {
    project.setAttribute('role', 'listitem');
    project.querySelector('.robot-name > span')?.remove();
    const technology = document.createElement('p');
    technology.className = 'robot-tech';
    technology.setAttribute('aria-hidden', 'true');
    technology.textContent = project.querySelector('.robot-meta > div:first-child p')?.textContent || '';
    project.querySelector('.robot-details').append(technology);
    project.querySelectorAll('img').forEach((img) => { img.loading = 'eager'; });
  });
  group.append(...projects);
  const clone = group.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  clone.inert = true;
  clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
  clone.querySelectorAll('[aria-labelledby]').forEach((element) => element.removeAttribute('aria-labelledby'));
  track.append(group, clone);
  robotList.append(track);
  let userPaused = false;
  let visible = false;
  const syncPlayback = () => {
    robotList.classList.toggle('is-marquee-running', visible && !document.hidden && !userPaused);
    marqueeToggle.setAttribute('aria-label', userPaused ? '로봇 자동 흐름 재생' : '로봇 자동 흐름 일시정지');
    marqueeToggle.querySelector('[data-marquee-label]').textContent = userPaused ? 'PLAY' : 'PAUSE';
    marqueeToggle.querySelector('[data-marquee-icon]').textContent = userPaused ? '▷' : 'Ⅱ';
  };
  const measure = () => {
    const distance = Number.parseFloat(getComputedStyle(group).width) + Number.parseFloat(getComputedStyle(track).gap);
    track.style.setProperty('--marquee-distance', `${distance}px`);
    track.style.setProperty('--marquee-duration', `${distance / 48}s`);
  };
  marqueeToggle.addEventListener('click', () => { userPaused = !userPaused; syncPlayback(); });
  document.addEventListener('visibilitychange', syncPlayback);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncPlayback(); }, {threshold:.1}).observe(robotList);
  } else { visible = true; syncPlayback(); }
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(group);
  window.addEventListener('resize', measure, {passive:true});
  if (document.fonts) document.fonts.ready.then(measure);
  measure();
}

const originBand = document.querySelector('.origin-band');
const originPath = document.getElementById('origin-course-path');
const originTracer = document.querySelector('.origin-tracer');
if (originBand && originPath && originTracer) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pathLength = originPath.getTotalLength();
  const courseDurationMs = 4800;
  const markerStopMs = 1700;
  let courseVisible = false;
  let courseFrame = 0;
  let cycleStartedAt = 0;
  let currentFraction = 0;

  const placeTracer = (fraction) => {
    currentFraction = fraction;
    const distance = Math.max(0, Math.min(1, fraction)) * pathLength;
    const point = originPath.getPointAtLength(distance);
    const before = originPath.getPointAtLength(Math.max(0, distance - 2));
    const after = originPath.getPointAtLength(Math.min(pathLength, distance + 2));
    const bandBounds = originBand.getBoundingClientRect();
    const svgBounds = originPath.ownerSVGElement.getBoundingClientRect();
    const scaleX = svgBounds.width / 1200;
    const scaleY = svgBounds.height / 205;
    const angle = Math.atan2((after.y - before.y) * scaleY, (after.x - before.x) * scaleX) * 180 / Math.PI + 90;
    originTracer.style.left = `${svgBounds.left - bandBounds.left + point.x * scaleX}px`;
    originTracer.style.top = `${svgBounds.top - bandBounds.top + point.y * scaleY}px`;
    originTracer.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;
  };
  const runCourse = (now) => {
    if (!courseVisible || document.hidden || reducedMotion.matches) {
      courseFrame = 0;
      return;
    }
    if (!cycleStartedAt) cycleStartedAt = now;
    const elapsed = (now - cycleStartedAt) % (courseDurationMs + markerStopMs);
    const progress = Math.min(elapsed / courseDurationMs, 1);
    const eased = (1 - Math.cos(Math.PI * progress)) / 2;
    placeTracer(eased);
    courseFrame = requestAnimationFrame(runCourse);
  };
  const syncCourse = () => {
    if (courseVisible && !document.hidden && !reducedMotion.matches) {
      if (!courseFrame) {
        cycleStartedAt = 0;
        placeTracer(0);
        courseFrame = requestAnimationFrame(runCourse);
      }
    } else {
      cancelAnimationFrame(courseFrame);
      courseFrame = 0;
      cycleStartedAt = 0;
      placeTracer(0);
    }
  };
  placeTracer(0);
  originTracer.style.opacity = '1';
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      courseVisible = entry.isIntersecting;
      syncCourse();
    }, { threshold: 0.2 }).observe(originBand);
  } else {
    courseVisible = true;
    syncCourse();
  }
  document.addEventListener('visibilitychange', syncCourse);
  reducedMotion.addEventListener('change', syncCourse);
  window.addEventListener('resize', () => placeTracer(currentFraction));
}

if ('IntersectionObserver' in window) {
  const revealTargets = document.querySelectorAll('.about .section-label, .about .section-overline, .about h2, .about-copy p, .origin-band, .robots .section-label, .robots .section-overline, .robots h2, .robots-lead, .robot-list, .approach .section-label, .approach .section-overline, .approach h2, .approach-lead, .approach-grid article, .contact .section-label, .contact-intro, .inquiry-form, .club .section-label, .club h2, .club-bottom');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
  }, { threshold: 0, rootMargin: '40px 0px 40px 0px' });
  revealTargets.forEach((target) => {
    target.classList.add('reveal-on-scroll');
    revealObserver.observe(target);
  });
}

const heroTitle = document.getElementById('hero-title');
if (heroTitle) {
  heroTitle.classList.add('is-animated');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      heroTitle.classList.toggle('is-visible', entry.isIntersecting);
    }, { threshold: 0.25 }).observe(document.querySelector('.hero'));
  } else {
    heroTitle.classList.add('is-visible');
  }
}
