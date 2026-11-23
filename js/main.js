/* ==========================================================================
   FIDELES CONFEITARIA: CORE RUNTIME & MOTION ENGINE
   Stack: Locomotive Scroll 4.1.4 + GSAP 3 + ScrollTrigger ScrollerProxy
   ========================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initMotionEngine();
});

/* ==========================================================================
   MOBILE NAVIGATION TOGGLE (ACCESSIBLE & TOUCH-SAFE)
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navOverlay = document.querySelector('.mobile-nav-overlay');
  const navLinks = document.querySelectorAll('.mobile-nav-link');

  if (!toggleBtn || !navOverlay) return;

  const toggleNav = () => {
    const isOpen = toggleBtn.classList.toggle('open');
    navOverlay.classList.toggle('active', isOpen);
    navOverlay.setAttribute('aria-hidden', !isOpen);
    toggleBtn.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  toggleBtn.addEventListener('click', toggleNav);

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navOverlay.classList.contains('active')) {
        toggleNav();
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navOverlay.classList.contains('active')) {
      toggleNav();
    }
  });
}

/* ==========================================================================
   LOCOMOTIVE SCROLL & GSAP SCROLLERPROXY INTEGRATION
   ========================================================================== */
function initMotionEngine() {
  const scrollContainer = document.querySelector('[data-scroll-container]');
  if (!scrollContainer) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header scroll state handler
  const header = document.querySelector('.main-header');
  const updateHeader = (scrollY) => {
    if (!header) return;
    if (scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  let locoScroll = null;

  if (!prefersReducedMotion && typeof LocomotiveScroll !== 'undefined') {
    locoScroll = new LocomotiveScroll({
      el: scrollContainer,
      smooth: true,
      smartphone: { smooth: false },
      tablet: { smooth: false },
      lerp: 0.08
    });

    locoScroll.on('scroll', (args) => {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.update();
      }
      const scrollY = args.scroll.y;
      updateHeader(scrollY);
      if (typeof window.__fidelesUpdateHeroScroll === 'function') {
        window.__fidelesUpdateHeroScroll(scrollY);
      }
    });

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      ScrollTrigger.scrollerProxy('[data-scroll-container]', {
        scrollTop(value) {
          return arguments.length ? locoScroll.scrollTo(value, 0, 0) : locoScroll.scroll.instance.scroll.y;
        },
        getBoundingClientRect() {
          return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
        },
        pinType: scrollContainer.style.transform ? 'transform' : 'fixed'
      });

      ScrollTrigger.addEventListener('refresh', () => locoScroll.update());
    }
  } else {
    // Native scroll fallback
    window.addEventListener('scroll', () => {
      updateHeader(window.scrollY);
      if (typeof window.__fidelesUpdateHeroScroll === 'function') {
        window.__fidelesUpdateHeroScroll(window.scrollY);
      }
    }, { passive: true });
  }

  // Smooth anchor navigation with Locomotive support
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        if (locoScroll) {
          locoScroll.scrollTo(targetEl);
        } else {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // GSAP Section Reveals (Initial state set via JS so content is 100% visible without JS)
  if (!prefersReducedMotion && typeof gsap !== 'undefined') {
    const scroller = locoScroll ? '[data-scroll-container]' : window;

    // Hero Timeline Entrance
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });
    heroTl
      .from('.hero-label', { opacity: 0, y: 16, delay: 0.1 })
      .from('.hero-headline', { opacity: 0, y: 30, duration: 1.0 }, '-=0.6')
      .from('.hero-description', { opacity: 0, y: 20 }, '-=0.6')
      .from('.hero-actions', { opacity: 0, y: 18 }, '-=0.6')
      .from('.hero-meta-item', { opacity: 0, y: 15, stagger: 0.1 }, '-=0.5');

    // Section Reveals
    const revealSections = [
      { trigger: '.credibility-section', targets: '.credibility-item' },
      { trigger: '.history-section', targets: '.history-visual, .history-content' },
      { trigger: '.moment-section', targets: '.moment-card' },
      { trigger: '.process-section', targets: '.process-step' },
      { trigger: '.info-section', targets: '.info-box' },
      { trigger: '.final-cta-section', targets: '.final-cta-title, .final-cta-desc, .final-cta-section .btn-primary' }
    ];

    revealSections.forEach(({ trigger, targets }) => {
      const el = document.querySelector(trigger);
      if (el) {
        gsap.from(targets, {
          scrollTrigger: {
            trigger: trigger,
            scroller: scroller,
            start: 'top 82%',
            once: true
          },
          opacity: 0,
          y: 36,
          duration: 0.75,
          stagger: 0.08,
          ease: 'power2.out'
        });
      }
    });

    // Divisor Cobertura Entrance
    const dividerEl = document.querySelector('.divider-cocoa');
    if (dividerEl) {
      gsap.from(dividerEl, {
        scrollTrigger: {
          trigger: dividerEl,
          scroller: scroller,
          start: 'top 92%',
          once: true
        },
        scaleY: 0.86,
        y: 24,
        duration: 0.9,
        ease: 'power3.out'
      });
    }

    // Refresh triggers once all fonts and layout settle
    window.addEventListener('load', () => {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
      if (locoScroll) {
        locoScroll.update();
      }
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        if (locoScroll) locoScroll.update();
      });
    }
  }
}
