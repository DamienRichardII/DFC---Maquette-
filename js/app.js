/* ===================================================
   DFC — Dieynissa Fashion Création
   JavaScript Vanilla — interactions & animations
=================================================== */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setYear();
    hideLoader();
    initNavbarScroll();
    initMobileNav();
    initSmoothAnchors();
    initHeroSlider();
    initReveal();
    initLookbookLightbox();
    initCreationsCarousel();
  }

  /* ---------- Footer year ---------- */
  function setYear() {
    var el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------- Loader ---------- */
  function hideLoader() {
    var loader = document.getElementById('loader');
    if (!loader) return;
    window.addEventListener('load', function () {
      setTimeout(function () { loader.classList.add('is-hidden'); }, 400);
    });
    // fallback in case load already fired
    setTimeout(function () { loader.classList.add('is-hidden'); }, 2500);
  }

  /* ---------- Navbar dynamic on scroll ---------- */
  function initNavbarScroll() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;
    function onScroll() {
      if (window.scrollY > 60) navbar.classList.add('is-scrolled');
      else navbar.classList.remove('is-scrolled');
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile hamburger nav ---------- */
  function initMobileNav() {
    var burger = document.getElementById('burgerBtn');
    var menu = document.getElementById('navMenu');
    if (!burger || !menu) return;

    burger.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('is-open');
      burger.classList.toggle('is-active', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('nav-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('is-open');
        burger.classList.remove('is-active');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Smooth anchors + active link highlight ---------- */
  function initSmoothAnchors() {
    var links = document.querySelectorAll('.nav-link');
    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute('href');
      var section = id && id.startsWith('#') ? document.querySelector(id) : null;
      if (section) sections.push({ link: link, section: section });
    });
    if (!sections.length) return;

    function onScroll() {
      var pos = window.scrollY + window.innerHeight * 0.35;
      var current = sections[0];
      sections.forEach(function (item) {
        if (item.section.offsetTop <= pos) current = item;
      });
      links.forEach(function (l) { l.classList.remove('active'); });
      current.link.classList.add('active');
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Hero slider (auto, fluid fade) ---------- */
  function initHeroSlider() {
    var slider = document.getElementById('heroSlider');
    var dotsWrap = document.getElementById('heroDots');
    if (!slider) return;
    var allSlides = Array.prototype.slice.call(slider.querySelectorAll('.hero__slide'));
    // Sur desktop (>860px), les photos au format portrait sont retirées du diaporama
    // pour éviter les bandes noires : seule la 1ère photo (format paysage) reste affichée.
    var isDesktop = window.matchMedia('(min-width: 861px)').matches;
    var slides = isDesktop
      ? allSlides.filter(function (s) { return s.dataset.portrait !== 'true'; })
      : allSlides;
    if (slides.length <= 1) return;

    var current = 0;
    var interval = 5500;
    var timer;

    slides.forEach(function (_, i) {
      var dot = document.createElement('span');
      if (i === 0) dot.classList.add('is-active');
      dot.addEventListener('click', function () { goTo(i); resetTimer(); });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function goTo(index) {
      slides[current].classList.remove('is-active');
      dots[current].classList.remove('is-active');
      current = index;
      slides[current].classList.add('is-active');
      dots[current].classList.add('is-active');
    }

    function next() { goTo((current + 1) % slides.length); }

    function resetTimer() {
      clearInterval(timer);
      timer = setInterval(next, interval);
    }

    resetTimer();
  }

  /* ---------- Reveal on scroll (fade / slide / zoom) ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          var el = entry.target;
          setTimeout(function () { el.classList.add('is-visible'); }, (i % 4) * 90);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Lookbook lightbox ---------- */
  function initLookbookLightbox() {
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightboxImg');
    var closeBtn = document.getElementById('lightboxClose');
    var items = document.querySelectorAll('.lookbook__item');
    if (!lightbox || !items.length) return;

    function open(src, alt) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    items.forEach(function (item) {
      item.addEventListener('click', function () {
        var img = item.querySelector('img');
        open(item.dataset.full || img.src, img.alt);
      });
    });

    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ---------- Creations carousel (drag/arrow scroll) ---------- */
  function initCreationsCarousel() {
    var track = document.getElementById('creationsTrack');
    var prev = document.getElementById('creationsPrev');
    var next = document.getElementById('creationsNext');
    if (!track) return;

    function cardStep() {
      var card = track.querySelector('.creation-card');
      return card ? card.getBoundingClientRect().width + 26 : 300;
    }

    prev && prev.addEventListener('click', function () {
      track.scrollBy({ left: -cardStep(), behavior: 'smooth' });
    });
    next && next.addEventListener('click', function () {
      track.scrollBy({ left: cardStep(), behavior: 'smooth' });
    });

    // Drag to scroll (mouse)
    var isDown = false, startX, scrollLeft;
    track.addEventListener('mousedown', function (e) {
      isDown = true;
      track.style.cursor = 'grabbing';
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });
    ['mouseleave', 'mouseup'].forEach(function (evt) {
      track.addEventListener(evt, function () { isDown = false; track.style.cursor = 'grab'; });
    });
    track.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      e.preventDefault();
      var x = e.pageX - track.offsetLeft;
      track.scrollLeft = scrollLeft - (x - startX) * 1.4;
    });
  }

})();
