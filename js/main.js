/* ==========================================================================
   MÔNICA FIDELES — INTERACTIVE MOTION, GRAPHICS & HARDENED JS ENGINE
   Stack: GSAP 3 + ScrollTrigger + Three.js + Performance & Security Safeguards
   ========================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Header Scroll State
  initHeader();

  // Initialize Mobile Navigation Menu
  initMobileNav();

  // Initialize Three.js Ambient Particle Atmosphere
  initThreeAtmosphere();

  // Initialize GSAP Timelines & ScrollTrigger
  initGSAPAnimations();
});

/* ==========================================================================
   HEADER SCROLLED STATE (PASSIVE LISTENERS & RAF OPTIMIZATION)
   ========================================================================== */
function initHeader() {
  const header = document.querySelector('.main-header');
  if (!header) return;

  let ticking = false;

  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 40) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

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

  // Close overlay on Escape key for keyboard accessibility
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navOverlay.classList.contains('active')) {
      toggleNav();
    }
  });
}

/* ==========================================================================
   THREE.JS PARTICLES (GLOWING POWDER ATMOSPHERE — MOBILE OPTIMIZED)
   ========================================================================== */
let globalParticles = null;

function initThreeAtmosphere() {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // Check prefers-reduced-motion to save GPU/Battery if user requested reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    canvas.style.display = 'none';
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: window.devicePixelRatio <= 1 });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Dynamic particle count based on screen width
  const isMobile = window.innerWidth < 768;
  const particleCount = isMobile ? 65 : 130;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 70;     // X
    positions[i + 1] = (Math.random() - 0.5) * 70; // Y
    positions[i + 2] = (Math.random() - 0.5) * 50; // Z
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Soft Powder Particle Material
  const material = new THREE.PointsMaterial({
    color: 0xE89CAE,
    size: isMobile ? 0.55 : 0.65,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);
  globalParticles = particles;

  // Mouse Interaction (Desktop only)
  let mouseX = 0;
  let mouseY = 0;

  if (!isMobile) {
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  // Animation Loop with Clock
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Gentle Rotation
    particles.rotation.y = elapsedTime * 0.035;
    particles.rotation.x = elapsedTime * 0.018;

    // Smooth Mouse Reactivity on Desktop
    if (!isMobile) {
      camera.position.x += (mouseX * 2.2 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 2.2 - camera.position.y) * 0.02;
    }

    renderer.render(scene, camera);
  }

  animate();

  // Resize Handler with Debounce
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 150);
  }, { passive: true });
}

/* ==========================================================================
   GSAP & SCROLLTRIGGER MOTION TIMELINES (PERFORMANCE HARMONIZED)
   ========================================================================== */
function initGSAPAnimations() {
  if (typeof gsap === 'undefined') return;

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // Respect user preference for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Hero Section Entrance Timeline (Cinematic Stagger)
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.0 } });

  heroTl
    .from('.hero-script-lead', { opacity: 0, y: 20, delay: 0.15 })
    .from('.hero-headline', { opacity: 0, y: 35, duration: 1.1 }, '-=0.65')
    .from('.hero-description', { opacity: 0, y: 20 }, '-=0.65')
    .from('.hero-actions', { opacity: 0, y: 20 }, '-=0.65')
    .from('.hero-visual-wrapper', { opacity: 0, scale: 0.94, y: 25, duration: 1.2 }, '-=0.85')
    .from('.hero-seal', { opacity: 0, scale: 0.6, rotation: -30, duration: 0.75 }, '-=0.45');

  // Parallax Scroll Effect & Section Reveals
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.to('.hero-img', {
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      },
      y: 40,
      ease: 'none'
    });

    // Credibility Stats Reveal
    gsap.from('.credibility-item', {
      scrollTrigger: {
        trigger: '.credibility-section',
        start: 'top 85%'
      },
      opacity: 0,
      y: 30,
      stagger: 0.12,
      duration: 0.8,
      ease: 'power2.out'
    });

    // History Section Parallax & Reveal
    gsap.from('.history-visual', {
      scrollTrigger: {
        trigger: '.history-section',
        start: 'top 75%'
      },
      opacity: 0,
      x: -35,
      duration: 1.0,
      ease: 'power3.out'
    });

    gsap.from('.history-content', {
      scrollTrigger: {
        trigger: '.history-section',
        start: 'top 75%'
      },
      opacity: 0,
      x: 35,
      duration: 1.0,
      ease: 'power3.out'
    });

    // Gallery Items Reveal
    gsap.from('.gallery-item', {
      scrollTrigger: {
        trigger: '.gallery-section',
        start: 'top 70%'
      },
      opacity: 0,
      y: 40,
      stagger: 0.1,
      duration: 0.9,
      ease: 'power3.out'
    });

    // Process Steps Reveal
    gsap.from('.process-step', {
      scrollTrigger: {
        trigger: '.process-section',
        start: 'top 75%'
      },
      opacity: 0,
      y: 35,
      stagger: 0.15,
      duration: 0.8,
      ease: 'power2.out'
    });

    // Info Section Boxes Reveal
    gsap.from('.info-box', {
      scrollTrigger: {
        trigger: '.info-section',
        start: 'top 75%'
      },
      opacity: 0,
      y: 30,
      stagger: 0.18,
      duration: 0.85,
      ease: 'power2.out'
    });

    // Particle Canvas Speed-up on Scroll
    ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        if (globalParticles) {
          globalParticles.rotation.y += self.getVelocity() * 0.00004;
        }
      }
    });
  }
}
