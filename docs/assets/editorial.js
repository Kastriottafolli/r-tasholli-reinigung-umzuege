(() => {
  'use strict';
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = document.body.classList.contains('motion-paused') || media.matches;
  const targets = [...document.querySelectorAll('[data-reveal]')];
  let revealObserver;

  // Observe before hiding anything: unsupported APIs never hide content.
  if ('IntersectionObserver' in window && !paused) {
    revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    }, {threshold:0.08, rootMargin:'0px 0px 24px 0px'});
    targets.forEach(el => revealObserver.observe(el));
    root.classList.add('reveal-enabled');
  }
  let scrollPending = false;
  function updateHeader() {
    document.body.classList.toggle('has-scrolled', window.scrollY > 16);
    scrollPending = false;
  }
  updateHeader();
  window.addEventListener('scroll', () => {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateHeader); }
  }, {passive:true});

  const hero = document.querySelector('.hero');
  const images = [...document.querySelectorAll('.hero-photo')];
  const buttons = [...document.querySelectorAll('.hero-select')];
  let current = 0;
  let timer;
  let visible = true;
  let hovered = false;
  let focused = false;
  let requested = 0;
  function schedule() {
    clearTimeout(timer);
    if (images.length < 2 || paused || document.hidden || !visible || hovered || focused) return;
    timer = setTimeout(() => select((current + 1) % images.length, true), 8000);
  }
  async function select(index, automatic = false) {
    if (!images[index]) return;
    const token = ++requested;
    // A failed image leaves the previous photograph intact.
    try { await images[index].decode(); } catch { schedule(); return; }
    if (token !== requested) return;
    if (automatic && (paused || document.hidden || !visible || hovered || focused)) { schedule(); return; }
    current = index;
    images.forEach((el, i) => el.classList.toggle('is-active', i === current));
    buttons.forEach((el, i) => {
      el.classList.toggle('is-active', i === current);
      el.setAttribute('aria-pressed', String(i === current));
    });
    schedule();
  }
  buttons.forEach((button, index) => button.addEventListener('click', () => select(index)));
  if (hero) {
    const loadAlternates = () => images.slice(1).forEach(img => { img.loading = 'eager'; });
    if (document.readyState === 'complete') loadAlternates();
    else window.addEventListener('load', loadAlternates, {once:true});
    hero.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      hovered = true; schedule();
    });
    hero.addEventListener('pointerleave', () => { hovered = false; schedule(); });
    hero.addEventListener('focusin', () => { focused = true; schedule(); });
    hero.addEventListener('focusout', event => {
      focused = !!event.relatedTarget && hero.contains(event.relatedTarget); schedule();
    });
    if ('IntersectionObserver' in window) {
      const heroObserver = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting; schedule();
      });
      heroObserver.observe(hero);
    }
    schedule();
  }
  function motionState(next) {
    paused = next;
    if (paused) {
      ++requested;
      root.classList.remove('reveal-enabled');
      revealObserver?.disconnect();
      targets.forEach(el => el.classList.add('is-visible'));
    }
    schedule();
  }
  document.addEventListener('rt:motion', event => motionState(event.detail.paused));
  media.addEventListener?.('change', event => { if (event.matches) motionState(true); });
  document.addEventListener('visibilitychange', schedule);
  const desktop = window.matchMedia('(min-width:981px)');
  desktop.addEventListener?.('change', event => {
    if (!event.matches) return;
    document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false');
    document.querySelector('#navigation')?.classList.remove('is-open');
  });
})();
