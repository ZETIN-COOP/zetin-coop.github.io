const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('.mobile-nav');
const isEnglish = document.documentElement.lang === 'en';

const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 20);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

if (menuButton && mobileNav) {
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', isEnglish ? 'Open menu' : '메뉴 열기');
    mobileNav.hidden = true;
    document.body.classList.remove('menu-open');
  };

  menuButton.addEventListener('click', () => {
    const opening = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', isEnglish ? (opening ? 'Close menu' : 'Open menu') : (opening ? '메뉴 닫기' : '메뉴 열기'));
    mobileNav.hidden = !opening;
    document.body.classList.toggle('menu-open', opening);
  });

  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 980) closeMenu(); });
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
  projects.forEach((project, index) => {
    project.setAttribute('role', 'listitem');
    project.querySelector('.robot-name > span')?.remove();
    const technology = document.createElement('p');
    technology.className = 'robot-tech';
    technology.setAttribute('aria-hidden', 'true');
    technology.textContent = project.querySelector('.robot-meta > div:first-child p')?.textContent || '';
    project.querySelector('.robot-details').append(technology);
    const opener = document.createElement('button');
    opener.type = 'button';
    opener.className = 'robot-open';
    opener.dataset.robotIndex = index;
    opener.tabIndex = -1;
    opener.setAttribute('aria-haspopup', 'dialog');
    opener.setAttribute('aria-controls', 'robot-detail-dialog');
    opener.setAttribute('aria-label', `${project.querySelector('h3').firstChild.textContent.trim()} ${isEnglish ? 'details' : '상세 보기'}`);
    const hint = document.createElement('span');
    hint.className = 'robot-open-label';
    hint.textContent = isEnglish ? 'DETAILS ↗' : '상세 보기 ↗';
    hint.setAttribute('aria-hidden', 'true');
    opener.append(hint);
    project.append(opener);
    project.querySelectorAll('img').forEach((img) => { img.loading = 'eager'; });
  });
  group.append(...projects);
  const clone = group.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  clone.querySelectorAll('button').forEach(button => { button.tabIndex = -1; });
  clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
  clone.querySelectorAll('[aria-labelledby]').forEach((element) => element.removeAttribute('aria-labelledby'));
  track.append(group, clone);
  robotList.append(track);
  const dialog = document.createElement('dialog');
  dialog.id = 'robot-detail-dialog';
  dialog.className = 'robot-detail-dialog';
  dialog.setAttribute('aria-labelledby', 'robot-detail-title');
  dialog.innerHTML = `<div class="robot-detail-header"><span>ROBOT PLATFORMS / IN DETAIL</span><button class="robot-detail-close" type="button" autofocus aria-label="${isEnglish ? 'Close robot details' : '로봇 상세 닫기'}">✕</button></div><nav class="robot-detail-nav" aria-label="${isEnglish ? 'Choose a robot' : '로봇 선택'}"></nav><div class="robot-detail-layout"><div class="robot-detail-image"></div><div class="robot-detail-copy"><h2 id="robot-detail-title"></h2><p class="robot-detail-description"></p><div class="robot-detail-sections"></div></div></div><div class="robot-detail-footer"><span>DESIGN · CONTROL · INTELLIGENCE</span><a href="#contact">${isEnglish ? 'Inquiry' : '프로젝트 문의'} ↗</a></div>`;
  document.body.append(dialog);
  const detailNav = dialog.querySelector('.robot-detail-nav');
  const detailTitle = dialog.querySelector('#robot-detail-title');
  const detailImage = dialog.querySelector('.robot-detail-image');
  const detailSections = dialog.querySelector('.robot-detail-sections');
  let detailOpener = null;
  let restoreDetailFocus = true;
  const sectionLabels = isEnglish ? {} : { 'TECHNOLOGY': '적용 기술', 'NEXT DIRECTION': '향후 개발 방향', 'BEGINNING': '시작점', 'THEN TO NOW': '이어지는 탐구' };
  const renderDetail = (index) => {
    const project = projects[index];
    if (!project) return;
    detailTitle.replaceChildren(...project.querySelector('h3').cloneNode(true).childNodes);
    dialog.querySelector('.robot-detail-description').textContent = project.querySelector('.robot-description').textContent;
    const visual = project.querySelector('.robot-visual').cloneNode(true);
    visual.querySelectorAll('span').forEach(span => span.remove());
    detailImage.replaceChildren(visual);
    detailSections.replaceChildren();
    project.querySelectorAll('.robot-meta > div').forEach(meta => {
      const section = document.createElement('section');
      const heading = document.createElement('h3');
      const key = meta.querySelector('h4').textContent;
      heading.textContent = sectionLabels[key] || key;
      section.append(heading);
      const content = meta.querySelector('p').textContent;
      if (key === 'TECHNOLOGY') {
        const list = document.createElement('ul');
        content.split(' · ').forEach(value => { const item = document.createElement('li'); item.textContent = value; list.append(item); });
        section.append(list);
      } else {
        const paragraph = document.createElement('p');
        paragraph.textContent = content;
        section.append(paragraph);
      }
      detailSections.append(section);
    });
    detailNav.querySelectorAll('button').forEach((button, buttonIndex) => button.setAttribute('aria-pressed', String(index === buttonIndex)));
  };
  projects.forEach((project, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = project.querySelector('h3').firstChild.textContent.trim();
    button.addEventListener('click', () => renderDetail(index));
    detailNav.append(button);
  });
  const openDetail = (index, opener) => {
    renderDetail(index);
    detailOpener = opener.closest('[aria-hidden="true"]') ? detailEntry : opener;
    detailOpener.focus({preventScroll:true});
    restoreDetailFocus = true;
    document.documentElement.classList.add('robot-detail-open');
    dialog.showModal();
    syncPlayback();
  };
  robotList.addEventListener('click', event => {
    if (performance.now() < suppressCardClickUntil) { event.preventDefault(); return; }
    const button = event.target.closest('.robot-open');
    if (button) openDetail(Number(button.dataset.robotIndex), button);
  });
  const detailEntry = document.createElement('button');
  detailEntry.type = 'button';
  detailEntry.className = 'robot-detail-entry';
  detailEntry.textContent = 'ROBOT PLATFORMS / DETAILS ↗';
  detailEntry.setAttribute('aria-label', isEnglish ? 'Explore robot details' : '로봇 상세 보기');
  detailEntry.setAttribute('aria-haspopup', 'dialog');
  detailEntry.setAttribute('aria-controls', dialog.id);
  robotList.closest('.panel-content').querySelector('.marquee-toolbar > span').replaceWith(detailEntry);
  detailEntry.addEventListener('click', () => openDetail(0, detailEntry));
  dialog.querySelector('.robot-detail-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.querySelector('.robot-detail-footer a').addEventListener('click', () => {
    restoreDetailFocus = false;
    document.documentElement.classList.remove('robot-detail-open');
    dialog.close();
    const contactHeading = document.getElementById('contact-title');
    contactHeading.tabIndex = -1;
    contactHeading.focus({preventScroll:true});
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('robot-detail-open');
    syncPlayback();
    if (restoreDetailFocus && detailOpener?.isConnected) detailOpener.focus({preventScroll:true});
  });
  let userPaused = false;
  let visible = false;
  let manualPaused = false;
  let dragState = null;
  let manualResumeTimer = 0;
  let suppressCardClickUntil = 0;
  const syncPlayback = () => {
    robotList.classList.toggle('is-marquee-running', visible && !document.hidden && !userPaused && !manualPaused && !dialog.open);
    marqueeToggle.setAttribute('aria-label', isEnglish ? (userPaused ? 'Play robot marquee' : 'Pause robot marquee') : (userPaused ? '로봇 자동 흐름 재생' : '로봇 자동 흐름 일시정지'));
    marqueeToggle.querySelector('[data-marquee-label]').textContent = userPaused ? 'PLAY' : 'PAUSE';
    marqueeToggle.querySelector('[data-marquee-icon]').textContent = userPaused ? '▷' : 'Ⅱ';
  };
  const measure = () => {
    const distance = Number.parseFloat(getComputedStyle(group).width) + Number.parseFloat(getComputedStyle(track).gap);
    track.style.setProperty('--marquee-distance', `${distance}px`);
    track.style.setProperty('--marquee-duration', `${distance / 48}s`);
  };
  const pauseAfterInteraction = () => {
    clearTimeout(manualResumeTimer);
    manualPaused = true;
    syncPlayback();
    manualResumeTimer = window.setTimeout(() => { manualPaused = false; syncPlayback(); }, 3000);
  };
  const motion = () => {
    const animation = track.getAnimations()[0];
    const distance = Number.parseFloat(getComputedStyle(track).getPropertyValue('--marquee-distance'));
    const duration = Number.parseFloat(getComputedStyle(track).animationDuration) * 1000;
    return animation && distance > 0 && duration > 0 ? {animation,distance,duration} : null;
  };
  const setPlayhead = (animation, time, duration) => { animation.currentTime = ((time % duration) + duration) % duration; };
  const finishDrag = (event) => {
    if (!dragState || (event && event.pointerId !== dragState.id)) return;
    const dragged = dragState.dragged;
    const pointerId = dragState.id;
    dragState = null;
    if (robotList.hasPointerCapture?.(pointerId)) robotList.releasePointerCapture(pointerId);
    robotList.classList.remove('is-dragging');
    if (dragged) {
      suppressCardClickUntil = performance.now() + 400;
      pauseAfterInteraction();
    } else { manualPaused = false; syncPlayback(); }
  };
  robotList.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    const current = motion();
    if (!current) return;
    clearTimeout(manualResumeTimer);
    dragState = {...current,id:event.pointerId,x:event.clientX,y:event.clientY,time:Number(current.animation.currentTime) || 0,dragged:false};
    manualPaused = true;
    syncPlayback();
  });
  robotList.addEventListener('pointermove', event => {
    if (!dragState || dragState.id !== event.pointerId) return;
    const dx = event.clientX - dragState.x;
    const dy = event.clientY - dragState.y;
    if (!dragState.dragged) {
      if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(dy)) return;
      dragState.dragged = true;
      robotList.setPointerCapture?.(event.pointerId);
      robotList.classList.add('is-dragging');
    }
    if (event.cancelable) event.preventDefault();
    setPlayhead(dragState.animation, dragState.time - dx / dragState.distance * dragState.duration, dragState.duration);
  }, {passive:false});
  window.addEventListener('pointerup', finishDrag);
  window.addEventListener('pointercancel', finishDrag);
  window.addEventListener('blur', () => finishDrag());
  robotList.addEventListener('pointerleave', event => { if (dragState && !dragState.dragged) finishDrag(event); });
  robotList.addEventListener('lostpointercapture', event => { if (event.target === robotList) finishDrag(event); });
  robotList.addEventListener('dragstart', event => event.preventDefault());
  const browseControls = document.createElement('div');
  browseControls.className = 'marquee-browse';
  [-1, 1].forEach(direction => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'marquee-step';
    button.textContent = direction < 0 ? '←' : '→';
    button.setAttribute('aria-label', isEnglish ? (direction < 0 ? 'Previous robot' : 'Next robot') : (direction < 0 ? '이전 로봇' : '다음 로봇'));
    button.setAttribute('aria-controls', robotList.id);
    button.addEventListener('click', () => {
      const stride = Number.parseFloat(getComputedStyle(projects[0]).width) + Number.parseFloat(getComputedStyle(group).gap);
      const current = motion();
      if (current) {
        pauseAfterInteraction();
        setPlayhead(current.animation, (Number(current.animation.currentTime) || 0) + direction * stride / current.distance * current.duration, current.duration);
      } else robotList.scrollBy({left:direction * stride,behavior:'auto'});
    });
    browseControls.append(button);
  });
  marqueeToggle.parentElement.append(browseControls);
  browseControls.append(marqueeToggle);
  marqueeToggle.addEventListener('click', () => {
    userPaused = !userPaused;
    if (!userPaused) { clearTimeout(manualResumeTimer); manualPaused = false; }
    syncPlayback();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishDrag(); syncPlayback(); });
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
  const wideCourse = window.matchMedia('(min-width: 1024px)');
  const pathLength = originPath.getTotalLength();
  const trail = originPath.cloneNode(false);
  trail.removeAttribute('id');
  trail.setAttribute('class', 'origin-course-trail');
  trail.style.strokeDasharray = `${pathLength}`;
  trail.style.strokeDashoffset = `${pathLength}`;
  originPath.after(trail);
  const courseDurationMs = 4800;
  const markerStopMs = 1700;
  const aboutPanel = originBand.closest('.about');
  const introDurationMs = 1800;
  let introState = reducedMotion.matches || !aboutPanel ? 'done' : 'waiting';
  let introReady = false;
  let introTimer = 0;
  let courseVisible = false;
  let courseFrame = 0;
  let cycleStartedAt = 0;
  let currentFraction = 0;

  const measureIntro = () => {
    if (introState === 'done') return;
    aboutPanel.classList.add('origin-intro-prepared');
    aboutPanel.dataset.originIntro = 'measuring';
    const scene = aboutPanel.getBoundingClientRect();
    const band = originBand.getBoundingClientRect();
    const courseWidth = originPath.ownerSVGElement.getBoundingClientRect().width;
    const tracerWidth = Number.parseFloat(getComputedStyle(originTracer).width);
    const heading = originBand.querySelector('.origin-band-head');
    const headingSize = Number.parseFloat(getComputedStyle(heading).fontSize);
    const portrait = window.innerWidth <= 760 && window.innerHeight > window.innerWidth;
    const fullHeadingSize = Math.max(headingSize, Math.min(scene.width * (portrait ? .075 : .028), scene.height * .07, 46));
    const fullGutter = portrait ? 24 : Math.min(64, scene.width * .035);
    const labelWidth = Math.max(...[...heading.children].map(label => label.getBoundingClientRect().width)) * fullHeadingSize / headingSize;
    const trackRoom = scene.width - 2 * (fullGutter + labelWidth + Math.max(20, scene.width * .018));
    const courseAndRobotRatio = originPath.getBBox().width / 1200 + 1.44 * tracerWidth / courseWidth;
    const fullCourseWidth = Math.min(scene.width * (portrait ? 3 : 1.75), scene.height * 1200 / 205 * .92, portrait ? Infinity : Math.max(100, trackRoom) / courseAndRobotRatio);
    const values = {
      'rest-left': band.left - scene.left, 'rest-top': band.top - scene.top,
      'rest-width': band.width, 'rest-height': band.height,
      'rest-course': courseWidth, 'full-course': fullCourseWidth,
      'rest-tracer': tracerWidth, 'full-tracer': tracerWidth * fullCourseWidth / courseWidth,
      'rest-heading': headingSize,
      'full-heading': fullHeadingSize,
      'rest-gutter': Number.parseFloat(getComputedStyle(heading).left), 'full-gutter': fullGutter,
    };
    Object.entries(values).forEach(([name, value]) => aboutPanel.style.setProperty(`--origin-${name}`, `${value}px`));
    aboutPanel.dataset.originIntro = introState;
  };
  const finishIntro = (animate = false) => {
    if (introState === 'done') return;
    const copyWasOpening = introState === 'settling';
    clearTimeout(introTimer);
    const complete = () => {
      introState = 'done';
      delete aboutPanel.dataset.originIntro;
      aboutPanel.classList.remove('origin-intro-prepared');
      if (animate || copyWasOpening) aboutPanel.classList.add('origin-copy-seen');
      cycleStartedAt = 0;
      document.dispatchEvent(new Event('originintroend'));
    };
    if (animate) {
      introState = 'settling';
      aboutPanel.dataset.originIntro = 'settling';
      introTimer = window.setTimeout(complete, introDurationMs);
    } else complete();
  };

  measureIntro();

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
    trail.style.strokeDashoffset = `${(1 - fraction) * pathLength}`;
    trail.style.strokeWidth = `${(wideCourse.matches ? 6.4 : 4.8) / scaleX}`;
  };
  const prepareIntro = () => {
    introState = 'waiting';
    cycleStartedAt = 0;
    measureIntro();
    placeTracer(0);
  };
  const runCourse = (now) => {
    if (!courseVisible || document.hidden || reducedMotion.matches) {
      courseFrame = 0;
      return;
    }
    if (introState === 'settling') {
      placeTracer(1);
      courseFrame = requestAnimationFrame(runCourse);
      return;
    }
    if (!cycleStartedAt) cycleStartedAt = now;
    const elapsed = introState === 'running' ? now - cycleStartedAt : (now - cycleStartedAt) % (courseDurationMs + markerStopMs);
    const progress = Math.min(elapsed / courseDurationMs, 1);
    const eased = (1 - Math.cos(Math.PI * progress)) / 2;
    placeTracer(eased);
    if (introState === 'running' && progress === 1) finishIntro(true);
    courseFrame = requestAnimationFrame(runCourse);
  };
  const syncCourse = () => {
    if (reducedMotion.matches) finishIntro();
    if (introState === 'waiting' && introReady && courseVisible && !document.hidden) {
      introState = 'running';
      aboutPanel.dataset.originIntro = 'running';
    }
    if (courseVisible && !document.hidden && !reducedMotion.matches) {
      if (introState === 'waiting') return;
      if (!courseFrame) {
        cycleStartedAt = 0;
        placeTracer(0);
        courseFrame = requestAnimationFrame(runCourse);
      }
    } else {
      if (introState === 'running' || introState === 'settling') finishIntro();
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
      courseVisible = entry.isIntersecting && entry.intersectionRatio >= .2;
      introReady = entry.intersectionRatio >= .85;
      syncCourse();
      if (entry.intersectionRatio <= .01 && introState === 'done' && !reducedMotion.matches) prepareIntro();
    }, { threshold: [0, .01, .2, .85], rootMargin: `-${header?.offsetHeight || 68}px 0px 0px 0px` }).observe(aboutPanel || originBand);
  } else {
    finishIntro();
    courseVisible = true;
    syncCourse();
  }
  document.addEventListener('visibilitychange', syncCourse);
  document.addEventListener('click', (event) => {
    if (event.target.closest('a[href="#about"]') && introState === 'done' && introReady && !reducedMotion.matches) {
      prepareIntro();
      syncCourse();
    }
  });
  reducedMotion.addEventListener('change', syncCourse);
  window.addEventListener('resize', () => {
    if (introState === 'waiting') measureIntro();
    else if (introState !== 'done') finishIntro();
    placeTracer(currentFraction);
  });
  if (document.fonts) document.fonts.ready.then(() => {
    if (introState === 'waiting') measureIntro();
  });
}

if ('IntersectionObserver' in window) {
  const revealTargets = document.querySelectorAll('.about .section-label, .about .section-overline, .about h2, .about-copy p, .origin-band, .robots .section-label, .robots .section-overline, .robots h2, .robots-lead, .robot-list, .approach .section-label, .approach .section-overline, .approach h2, .approach-lead, .approach-grid article, .contact .section-label, .contact-intro, .inquiry-form, .club .section-label, .club h2, .club-bottom');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
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
    const titleObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      heroTitle.classList.add('is-visible');
      titleObserver.unobserve(entry.target);
    }, { threshold: 0.25 });
    titleObserver.observe(document.querySelector('.hero'));
  } else {
    heroTitle.classList.add('is-visible');
  }
}
