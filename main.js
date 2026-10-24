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

const robotList = document.querySelector('.robot-list');
const previousProject = document.querySelector('[data-carousel-prev]');
const nextProject = document.querySelector('[data-carousel-next]');
const currentProject = document.querySelector('[data-carousel-current]');

if (robotList && previousProject && nextProject && currentProject) {
  const projects = [...robotList.querySelectorAll(':scope > .robot-row')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeIndex = 0;
  let physicalIndex = 1;
  let currentOffset = 0;
  let autoTimer = 0;
  let slideFrame = 0;
  let moving = false;
  let queuedMoves = 0;
  let carouselVisible = false;
  let pointerStartX = null;
  let pointerStartY = null;
  let readingUntil = 0;
  const autoPauseMs = 4200;
  const slideDurationMs = 1100;

  projects.forEach((project, index) => {
    project.setAttribute('aria-roledescription', 'slide');
    project.setAttribute('aria-label', `${index + 1} / ${projects.length}: ${project.querySelector('h3')?.textContent.trim() || '프로젝트'}`);
  });

  const makeClone = (project) => {
    const clone = project.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.removeAttribute('aria-labelledby');
    clone.inert = true;
    clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    return clone;
  };
  const leadingClone = makeClone(projects.at(-1));
  const trailingClone = makeClone(projects[0]);
  const track = document.createElement('div');
  track.className = 'robot-track';
  track.append(leadingClone, ...projects, trailingClone);
  robotList.append(track);
  robotList.classList.add('is-enhanced');
  robotList.scrollLeft = 0;
  const cards = [...track.children];
  const positionFor = (index) => cards[index].offsetLeft - cards[0].offsetLeft;
  const setPosition = (offset) => {
    currentOffset = offset;
    track.style.transform = `translate3d(${-offset}px,0,0)`;
  };
  const setActive = (index) => {
    activeIndex = (index + projects.length) % projects.length;
    currentProject.textContent = String(activeIndex + 1).padStart(2, '0');
    currentProject.closest('.carousel-controls')?.style.setProperty('--carousel-index', activeIndex);
    previousProject.disabled = false;
    nextProject.disabled = false;
    const focusedSlide = document.activeElement?.closest('.robot-row');
    if (focusedSlide && projects.indexOf(focusedSlide) !== activeIndex) robotList.focus({ preventScroll: true });
    projects.forEach((project, i) => {
      const active = i === activeIndex;
      project.classList.toggle('is-active', active);
      project.inert = !active;
      project.setAttribute('aria-hidden', String(!active));
    });
    leadingClone.classList.toggle('is-active', activeIndex === projects.length - 1);
    trailingClone.classList.toggle('is-active', activeIndex === 0);
  };
  const stopAuto = () => {
    clearTimeout(autoTimer);
    autoTimer = 0;
  };
  const canAuto = () => carouselVisible && !document.hidden && !reducedMotion.matches && projects.length > 1 && !robotList.matches(':focus-within') && performance.now() >= readingUntil;
  const scheduleAuto = () => {
    stopAuto();
    if (canAuto() && !moving && !pointerStartX) autoTimer = window.setTimeout(() => move(1), autoPauseMs);
  };
  const finishSlide = () => {
    if (physicalIndex === 0) physicalIndex = projects.length;
    if (physicalIndex === projects.length + 1) physicalIndex = 1;
    setPosition(positionFor(physicalIndex));
    moving = false;
    setActive(physicalIndex - 1);
    if (queuedMoves) {
      const direction = Math.sign(queuedMoves);
      queuedMoves -= direction;
      move(direction);
    } else {
      scheduleAuto();
    }
  };
  const move = (direction) => {
    stopAuto();
    if (moving) {
      queuedMoves = Math.max(-projects.length, Math.min(projects.length, queuedMoves + direction));
      return;
    }
    const start = currentOffset;
    physicalIndex += direction;
    const destination = positionFor(physicalIndex);
    if (reducedMotion.matches) {
      setPosition(destination);
      finishSlide();
      return;
    }
    const startedAt = performance.now();
    moving = true;
    const animateSlide = (now) => {
      const progress = Math.min((now - startedAt) / slideDurationMs, 1);
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      setPosition(start + (destination - start) * eased);
      if (progress < 1) {
        slideFrame = requestAnimationFrame(animateSlide);
      } else {
        slideFrame = 0;
        finishSlide();
      }
    };
    slideFrame = requestAnimationFrame(animateSlide);
  };

  previousProject.addEventListener('click', () => move(-1));
  nextProject.addEventListener('click', () => move(1));
  robotList.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  robotList.addEventListener('pointerdown', (event) => {
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    stopAuto();
  });
  robotList.addEventListener('pointerup', (event) => {
    if (pointerStartX === null) return;
    const distance = event.clientX - pointerStartX;
    const verticalDistance = event.clientY - pointerStartY;
    pointerStartX = null;
    pointerStartY = null;
    if (Math.abs(distance) > 35 && Math.abs(distance) > Math.abs(verticalDistance)) move(distance < 0 ? 1 : -1);
    else scheduleAuto();
  });
  robotList.addEventListener('pointercancel', () => { pointerStartX = null; pointerStartY = null; scheduleAuto(); });
  robotList.addEventListener('focusin', stopAuto);
  robotList.addEventListener('focusout', () => setTimeout(scheduleAuto, 0));
  robotList.addEventListener('scroll', (event) => {
    if (!event.target.classList?.contains('robot-details')) return;
    readingUntil = performance.now() + 6000;
    stopAuto();
    autoTimer = setTimeout(scheduleAuto, 6000);
  }, {capture:true, passive:true});
  const refreshCarouselLayout = () => {
    cancelAnimationFrame(slideFrame);
    slideFrame = 0;
    moving = false;
    queuedMoves = 0;
    if (physicalIndex === 0) physicalIndex = projects.length;
    if (physicalIndex === projects.length + 1) physicalIndex = 1;
    setPosition(positionFor(physicalIndex));
    setActive(physicalIndex - 1);
    scheduleAuto();
  };
  window.addEventListener('resize', refreshCarouselLayout);
  robotList.addEventListener('carousel:layout', refreshCarouselLayout);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      carouselVisible = entry.isIntersecting;
      scheduleAuto();
    }, { threshold: 0.2 }).observe(robotList);
  } else {
    carouselVisible = true;
    scheduleAuto();
  }
  document.addEventListener('visibilitychange', scheduleAuto);
  reducedMotion.addEventListener('change', scheduleAuto);
  setActive(0);
  setPosition(positionFor(1));
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
  const revealTargets = document.querySelectorAll('.about .section-label, .about .section-overline, .about h2, .about-copy p, .origin-band, .robots .section-label, .robots .section-overline, .robots h2, .robots-lead, .robot-list, .approach .section-label, .approach .section-overline, .approach h2, .approach-lead, .approach-grid article, .project-inquiry, .club .section-label, .club h2, .club-bottom');
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
