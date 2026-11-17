'use strict';

let currentLang = 'fi';

function setLanguage(lang) {
  if (!Object.hasOwn(translations, lang)) return;
  currentLang = lang;
  const dictionary = translations[lang];

  document.querySelectorAll('[data-i18n]').forEach(element => {
    const text = dictionary[element.dataset.i18n];
    if (typeof text === 'string') element.textContent = text;
  });
  ['aria-label', 'alt'].forEach(attribute => {
    document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
      const text = dictionary[element.getAttribute(`data-i18n-${attribute}`)];
      if (typeof text === 'string') element.setAttribute(attribute, text);
    });
  });
  document.querySelectorAll('.lang-btn').forEach(button => {
    const active = button.dataset.lang === lang;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.documentElement.lang = lang;
  document.title = dictionary.page_title;
  document.querySelector('meta[name="description"]').content = dictionary.meta_description;
  try { localStorage.setItem('beautykeepers-language', lang); } catch { /* Storage may be disabled. */ }
  document.dispatchEvent(new Event('languagechange'));
}

function initCarousel() {
  const carousel = document.querySelector('.carousel');
  const track = document.getElementById('carouselTrack');
  const dots = document.getElementById('carouselDots');
  const previous = document.getElementById('carouselPrev');
  const next = document.getElementById('carouselNext');
  const toggle = document.getElementById('carouselToggle');
  if (!carousel || !track || !dots || !previous || !next || !toggle) return;
  const slides = Array.from(track.children);
  if (!slides.length) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reducedMotion.matches;
  let hovered = false;
  let focused = false;
  let current = 0;
  let timer;
  let positions = [];
  let resizeFrame;
  let scrollFrame;

  function updateLabels() {
    const dictionary = translations[currentLang];
    toggle.dataset.i18n = paused ? 'carousel_play' : 'carousel_pause';
    toggle.textContent = dictionary[toggle.dataset.i18n];
    toggle.setAttribute('aria-pressed', String(paused));
    Array.from(dots.children).forEach((dot, index) => {
      dot.setAttribute('aria-label', dictionary.carousel_page.replace('{page}', index + 1).replace('{total}', positions.length));
      dot.classList.toggle('active', index === current);
      dot.setAttribute('aria-current', String(index === current));
    });
  }

  function restartTimer() {
    clearInterval(timer);
    if (!paused && !hovered && !focused && !document.hidden && positions.length > 1) {
      timer = setInterval(() => goTo(current + 1), 5000);
    }
  }

  function goTo(index, smooth = true) {
    current = (index + positions.length) % positions.length;
    track.scrollTo({left: positions[current], behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant'});
    updateLabels();
  }

  function rebuild() {
    const visible = Number(getComputedStyle(carousel).getPropertyValue('--visible-slides')) || 1;
    const step = slides[0].getBoundingClientRect().width;
    const lastStart = Math.max(0, slides.length - visible);
    const firstVisible = Math.round(track.scrollLeft / step);
    positions = Array.from({length: Math.ceil(slides.length / visible)}, (_, page) => Math.min(page * visible, lastStart) * step);
    current = positions.reduce((best, pos, i) => Math.abs(pos - firstVisible * step) < Math.abs(positions[best] - firstVisible * step) ? i : best, 0);
    dots.replaceChildren();
    positions.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-controls', track.id);
      dot.addEventListener('click', () => { goTo(index); restartTimer(); });
      dots.appendChild(dot);
    });
    previous.hidden = next.hidden = positions.length <= 1;
    carousel.querySelector('.carousel-controls').hidden = positions.length <= 1;
    goTo(current, false);
    restartTimer();
  }

  previous.addEventListener('click', () => { goTo(current - 1); restartTimer(); });
  next.addEventListener('click', () => { goTo(current + 1); restartTimer(); });
  toggle.addEventListener('click', () => { paused = !paused; updateLabels(); restartTimer(); });
  track.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') goTo(0);
    else if (event.key === 'End') goTo(positions.length - 1);
    else goTo(current + (event.key === 'ArrowRight' ? 1 : -1));
    restartTimer();
  });
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      current = positions.reduce((best, pos, i) => Math.abs(pos - track.scrollLeft) < Math.abs(positions[best] - track.scrollLeft) ? i : best, 0);
      updateLabels();
    });
  }, {passive: true});
  carousel.addEventListener('mouseenter', () => { hovered = true; restartTimer(); });
  carousel.addEventListener('mouseleave', () => { hovered = false; restartTimer(); });
  carousel.addEventListener('focusin', () => { focused = true; restartTimer(); });
  carousel.addEventListener('focusout', event => {
    focused = carousel.contains(event.relatedTarget);
    restartTimer();
  });
  track.addEventListener('pointerdown', () => { paused = true; updateLabels(); restartTimer(); }, {passive: true});
  document.addEventListener('visibilitychange', restartTimer);
  document.addEventListener('languagechange', updateLabels);
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; updateLabels(); restartTimer(); });
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(rebuild);
  });
  rebuild();
}

document.addEventListener('DOMContentLoaded', () => {
  let initialLanguage = 'fi';
  try {
    const saved = localStorage.getItem('beautykeepers-language');
    if (saved && Object.hasOwn(translations, saved)) initialLanguage = saved;
  } catch { /* Keep Finnish when storage is disabled. */ }
  setLanguage(initialLanguage);
  document.querySelectorAll('.lang-btn').forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.lang));
  });
  initCarousel();
});
