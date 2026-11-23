/* ==========================================================================
   FIDELES CONFEITARIA: HERO 3D ATELIÊ SCENE
   Three.js r128 — Multi-plane depth stage with confectionery atmosphere
   ========================================================================== */

'use strict';

(function initHero3D() {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || window.innerWidth < 768) {
    canvas.style.display = 'none';
    return;
  }

  const heroSection = document.querySelector('.hero-section');
  if (!heroSection) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 8;

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: window.devicePixelRatio <= 1,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Gallery texture images (-480.webp for lightweight GPU memory)
  const imageSources = [
    './assets/images/bolo-galeria-1-480.webp',
    './assets/images/bolo-galeria-2-480.webp',
    './assets/images/bolo-galeria-3-480.webp',
    './assets/images/bolo-galeria-4-480.webp',
    './assets/images/bolo-galeria-5-480.webp',
    './assets/images/bolo-galeria-6-480.webp',
    './assets/images/bolo-galeria-7-480.webp',
    './assets/images/bolo-galeria-1-480.webp',
    './assets/images/bolo-galeria-3-480.webp',
    './assets/images/bolo-galeria-5-480.webp'
  ];

  const textureLoader = new THREE.TextureLoader();
  const planeGroup = new THREE.Group();
  scene.add(planeGroup);

  const planes = [];
  const planeGeom = new THREE.PlaneGeometry(2.2, 2.9);

  // Position distribution across depth z from -2 to -14
  const layout = [
    { x: 3.8,  y: 0.8,   z: -2.5, rot: -0.06 },
    { x: 5.2,  y: -1.8,  z: -4.5, rot: 0.05 },
    { x: 2.9,  y: -2.5,  z: -6.0, rot: -0.04 },
    { x: 6.5,  y: 2.2,   z: -8.0, rot: 0.08 },
    { x: 4.5,  y: 3.2,   z: -9.5, rot: -0.05 },
    { x: -5.2, y: -2.8,  z: -11.0, rot: 0.06 },
    { x: 7.0,  y: -0.5,  z: -12.5, rot: -0.07 },
    { x: 3.2,  y: 4.0,   z: -13.5, rot: 0.04 },
    { x: 5.8,  y: -3.6,  z: -14.0, rot: -0.03 },
    { x: -6.0, y: 3.5,   z: -14.5, rot: 0.05 }
  ];

  imageSources.forEach((src, idx) => {
    const tex = textureLoader.load(src);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;

    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.72 - (idx * 0.035),
      depthWrite: false
    });

    const mesh = new THREE.Mesh(planeGeom, mat);
    const pos = layout[idx] || { x: 4 + idx * 0.4, y: (idx % 2 === 0 ? 1 : -1) * 2, z: -3 - idx, rot: 0 };
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.rotation.z = pos.rot;
    mesh.userData = {
      baseX: pos.x,
      baseY: pos.y,
      baseZ: pos.z,
      rotZ: pos.rot,
      driftSpeed: 0.3 + (idx * 0.06)
    };

    planeGroup.add(mesh);
    planes.push(mesh);
  });

  // Ambient Light Fields:
  // 1. Golden light field (6% opacity, warm amber #C99728)
  const goldLightGeom = new THREE.PlaneGeometry(16, 16);
  const goldLightMat = new THREE.MeshBasicMaterial({
    color: 0xC99728,
    transparent: true,
    opacity: 0.06,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const goldLightMesh = new THREE.Mesh(goldLightGeom, goldLightMat);
  goldLightMesh.position.set(2, 0, -5);
  scene.add(goldLightMesh);

  // 2. Wine screen-blend light field (8% opacity, #8A0433)
  const wineLightGeom = new THREE.PlaneGeometry(18, 18);
  const wineLightMat = new THREE.MeshBasicMaterial({
    color: 0x8A0433,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const wineLightMesh = new THREE.Mesh(wineLightGeom, wineLightMat);
  wineLightMesh.position.set(-3, -1, -7);
  scene.add(wineLightMesh);

  // 3. Smoke/Veil Shader Plane (subtle sine-wave noise, 12% opacity, choco-300 #C79A72)
  const smokeGeom = new THREE.PlaneGeometry(22, 14, 16, 16);
  const smokeMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0xC79A72) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float n1 = sin(vUv.x * 3.5 + uTime * 0.35) * cos(vUv.y * 3.0 + uTime * 0.25);
        float n2 = sin(vUv.x * 7.0 - uTime * 0.2) * sin(vUv.y * 6.0 + uTime * 0.4);
        float pattern = smoothstep(-0.8, 1.0, (n1 + n2 * 0.5));
        float alpha = pattern * 0.12 * smoothstep(0.0, 0.4, vUv.x) * smoothstep(1.0, 0.6, vUv.x);
        gl_FragColor = vec4(uColor, alpha);
      }
    `
  });
  const smokeMesh = new THREE.Mesh(smokeGeom, smokeMat);
  smokeMesh.position.set(0, 0, -4);
  scene.add(smokeMesh);

  // Mouse & Scroll Parallax State
  let targetMouseX = 0;
  let targetMouseY = 0;
  let currentMouseX = 0;
  let currentMouseY = 0;
  let scrollProgress = 0;
  let isHeroVisible = true;
  let animId = null;

  window.addEventListener('mousemove', (e) => {
    // Parallax limits: max 18px in world units (~0.35)
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 0.7;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
  }, { passive: true });

  // Update scroll progress (capped at hero section)
  function onScrollUpdate(scrollY) {
    const heroH = heroSection.offsetHeight || window.innerHeight;
    scrollProgress = Math.min(Math.max(scrollY / heroH, 0), 1.2);
  }
  window.addEventListener('scroll', () => onScrollUpdate(window.scrollY), { passive: true });
  window.__fidelesUpdateHeroScroll = onScrollUpdate;

  // Visibility & Intersection Observers
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isHeroVisible = entry.isIntersecting;
      if (isHeroVisible && !animId) {
        startLoop();
      } else if (!isHeroVisible && animId) {
        stopLoop();
      }
    });
  }, { threshold: 0.05 });
  observer.observe(heroSection);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopLoop();
    } else if (isHeroVisible) {
      startLoop();
    }
  });

  const clock = new THREE.Clock();

  function renderFrame() {
    const elapsed = clock.getElapsedTime();

    // Lerp mouse
    currentMouseX += (targetMouseX - currentMouseX) * 0.05;
    currentMouseY += (targetMouseY - currentMouseY) * 0.05;

    smokeMat.uniforms.uTime.value = elapsed;

    // Scroll parallax (max 60px in world units = ~1.2)
    const scrollOffset = scrollProgress * 1.2;

    planes.forEach((mesh) => {
      const u = mesh.userData;
      mesh.position.x = u.baseX + currentMouseX * (1.2 / -u.baseZ);
      mesh.position.y = u.baseY - currentMouseY * (1.0 / -u.baseZ) + Math.sin(elapsed * u.driftSpeed) * 0.12 - scrollOffset * (0.8 / -u.baseZ);
    });

    goldLightMesh.position.x = 2 + currentMouseX * 0.4;
    wineLightMesh.position.x = -3 - currentMouseX * 0.3;

    renderer.render(scene, camera);
  }

  function startLoop() {
    if (animId) return;
    renderer.setAnimationLoop(renderFrame);
    animId = true;
  }

  function stopLoop() {
    renderer.setAnimationLoop(null);
    animId = null;
  }

  startLoop();

  // Resize Handler with Debounce
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth < 768) {
        canvas.style.display = 'none';
        stopLoop();
        return;
      } else {
        canvas.style.display = 'block';
        if (isHeroVisible) startLoop();
      }
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 150);
  }, { passive: true });
})();
