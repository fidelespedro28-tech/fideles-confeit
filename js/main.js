/* ==========================================================================
   FIDELES CONFEITARIA: MAIN RUNTIME & MOTION ENGINE
   Stack: Vanilla JS + GSAP 3 + ScrollTrigger (Native Fluid Performance)
   ========================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initGSAPMotion();
});

/* Header Scroll Transition */
function initHeader() {
  const header = document.querySelector('.main-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* Accessible Mobile Navigation */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navOverlay = document.querySelector('.mobile-nav-overlay');
  const navLinks = document.querySelectorAll('.mobile-nav-link');

  if (!toggleBtn || !navOverlay) return;

  const toggle = () => {
    const isOpen = toggleBtn.classList.toggle('open');
    navOverlay.classList.toggle('active', isOpen);
    navOverlay.setAttribute('aria-hidden', !isOpen);
    toggleBtn.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  toggleBtn.addEventListener('click', toggle);

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navOverlay.classList.contains('active')) toggle();
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navOverlay.classList.contains('active')) toggle();
  });
}

/* GSAP Animations & Section Reveals */
function initGSAPMotion() {
  if (typeof gsap === 'undefined') return;

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // Hero Entrance
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.95 } });
  heroTl
    .from('.hero-label', { opacity: 0, y: 15, delay: 0.15 })
    .from('.hero-headline', { opacity: 0, y: 30, duration: 1.05 }, '-=0.65')
    .from('.hero-description', { opacity: 0, y: 20 }, '-=0.65')
    .from('.hero-actions-group', { opacity: 0, y: 20 }, '-=0.65')
    .from('.hero-meta', { opacity: 0, y: 18 }, '-=0.5')
    .from('.hero-visual-col', { opacity: 0, scale: 0.95, y: 25, duration: 1.1 }, '-=0.9');

  if (typeof ScrollTrigger !== 'undefined') {
    // Parallax on hero image
    gsap.to('.hero-portrait', {
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      },
      y: 35,
      ease: 'none'
    });

    // Credibility items reveal
    gsap.from('.credibility-item', {
      scrollTrigger: {
        trigger: '.credibility-section',
        start: 'top 85%'
      },
      opacity: 0,
      y: 28,
      stagger: 0.1,
      duration: 0.8,
      ease: 'power2.out'
    });

    // History section reveal
    gsap.from('.history-visual', {
      scrollTrigger: {
        trigger: '.history-section',
        start: 'top 75%'
      },
      opacity: 0,
      x: -30,
      duration: 0.9,
      ease: 'power3.out'
    });

    gsap.from('.history-content', {
      scrollTrigger: {
        trigger: '.history-section',
        start: 'top 75%'
      },
      opacity: 0,
      x: 30,
      duration: 0.9,
      ease: 'power3.out'
    });

    // Process steps reveal
    gsap.from('.process-step', {
      scrollTrigger: {
        trigger: '.process-section',
        start: 'top 80%'
      },
      opacity: 0,
      y: 30,
      stagger: 0.14,
      duration: 0.8,
      ease: 'power2.out'
    });

    // Moment card
    gsap.from('.moment-card', {
      scrollTrigger: {
        trigger: '.moment-section',
        start: 'top 80%'
      },
      opacity: 0,
      y: 35,
      duration: 0.85,
      ease: 'power3.out'
    });

    // Info section boxes
    gsap.from('.info-box', {
      scrollTrigger: {
        trigger: '.info-section',
        start: 'top 80%'
      },
      opacity: 0,
      y: 30,
      stagger: 0.15,
      duration: 0.85,
      ease: 'power2.out'
    });
  }
}
