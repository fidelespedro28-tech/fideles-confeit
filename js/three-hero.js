/* ==========================================================================
   FIDELES CONFEITARIA: AMBIENT CHAMPAGNE SUGAR POWDER ATMOSPHERE
   Three.js r128 — Floating particles with delicate Brownian motion
   ========================================================================== */

'use strict';

(function initAmbientAtmosphere() {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  canvas.style.pointerEvents = 'none';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 35;

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: window.devicePixelRatio <= 1
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const count = window.innerWidth < 768 ? 25 : 65;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);

  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 85;
    positions[i + 1] = (Math.random() - 0.5) * 75;
    positions[i + 2] = (Math.random() - 0.5) * 40;
    scales[i / 3] = Math.random() * 0.7 + 0.3;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Soft warm gold / rose confectionery powder
  const material = new THREE.PointsMaterial({
    color: 0xC99728,
    size: 0.65,
    transparent: true,
    opacity: 0.38,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    particles.rotation.y = elapsed * 0.025;
    particles.rotation.x = elapsed * 0.015;

    camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.02;

    renderer.render(scene, camera);
  }

  animate();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 150);
  }, { passive: true });
})();
