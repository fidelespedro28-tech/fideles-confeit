/* ==========================================================================
   FIDELES CONFEITARIA: 3D EDITORIAL GALLERY ENGINE
   Port of Golden Angle Depth Algorithm to Vanilla Three.js r128
   ========================================================================== */

'use strict';

(function init3DGallery() {
  const container = document.getElementById('gallery-3d-stage');
  const fallbackGrid = document.getElementById('gallery-fallback-grid');
  const engageBtn = document.getElementById('gallery-3d-toggle');
  
  if (!container || typeof THREE === 'undefined') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || window.innerWidth < 768) {
    if (container) container.style.display = 'none';
    if (fallbackGrid) fallbackGrid.style.display = 'grid';
    return;
  }

  const imageList = [
    './assets/images/bolo-galeria-1-480.webp',
    './assets/images/bolo-galeria-2-480.webp',
    './assets/images/bolo-galeria-3-480.webp',
    './assets/images/bolo-galeria-4-480.webp',
    './assets/images/bolo-galeria-5-480.webp',
    './assets/images/bolo-galeria-6-480.webp',
    './assets/images/bolo-galeria-7-480.webp'
  ];

  const captions = [
    'Bolo Festivo Decorado',
    'Doces de Celebração',
    'Acabamento Artesanal',
    'Bolo Temático Especial',
    'Texturas & Detalhes',
    'Doces Finos',
    'Criação Personalizada'
  ];

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 7);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: window.devicePixelRatio <= 1,
    powerPreference: 'high-performance'
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  container.appendChild(renderer.domElement);

  const textureLoader = new THREE.TextureLoader();
  const textures = imageList.map(src => {
    const tex = textureLoader.load(src);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
  });

  // Shaders for Golden Angle Gallery Planes
  const vertexShader = `
    uniform float time;
    uniform float scrollForce;
    uniform float isHovered;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vNormal = normal;
      vec3 pos = position;

      // Subtle cylindrical arching
      pos.z += (sin(uv.x * 3.14159) * 0.14) * (1.0 + isHovered * 0.2);

      // Ripple wave on hover
      float hoverWave = sin(uv.y * 8.0 - time * 3.5) * isHovered * 0.04;
      pos.z += hoverWave;

      // Flag wave induced by scroll momentum
      float flagWave = sin(uv.x * 5.0 + time * 2.5) * 0.035 * clamp(scrollForce, -2.0, 2.0);
      pos.y += flagWave;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    uniform sampler2D map;
    uniform float opacity;
    uniform float blurAmount;
    uniform float isHovered;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      // 3x3 blur kernel approximation for smooth mobile/desktop performance
      vec2 texel = vec2(1.0 / 480.0, 1.0 / 640.0) * blurAmount * 1.8;
      vec4 col = texture2D(map, vUv) * 0.36;
      col += texture2D(map, vUv + vec2(texel.x, 0.0)) * 0.16;
      col += texture2D(map, vUv - vec2(texel.x, 0.0)) * 0.16;
      col += texture2D(map, vUv + vec2(0.0, texel.y)) * 0.16;
      col += texture2D(map, vUv - vec2(0.0, texel.y)) * 0.16;

      // Curve Highlight Specular Edge
      float edgeGlow = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 3.0) * (0.08 + isHovered * 0.14);
      col.rgb += vec3(edgeGlow);

      // Warm tone balance matching confectionery palette
      col.rgb = mix(col.rgb, col.rgb * vec3(1.04, 0.98, 0.94), 0.3);

      gl_FragColor = vec4(col.rgb, opacity);
    }
  `;

  const planeCount = 8;
  const depthRange = 36.0;
  const geometry = new THREE.PlaneGeometry(2.0, 2.6, 24, 24);
  const planes = [];
  const galleryGroup = new THREE.Group();
  scene.add(galleryGroup);

  for (let i = 0; i < planeCount; i++) {
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        map: { value: textures[i % textures.length] },
        opacity: { value: 1.0 },
        blurAmount: { value: 0.0 },
        scrollForce: { value: 0.0 },
        time: { value: 0.0 },
        isHovered: { value: 0.0 }
      }
    });

    const mesh = new THREE.Mesh(geometry, mat);

    // Golden Angle spiral distribution (i * 2.618 and i * 1.618 + PI/3)
    const angleX = i * 2.618;
    const angleY = i * 1.618 + Math.PI / 3.0;
    const radiusX = 2.4 + Math.sin(i) * 0.4;
    const radiusY = 1.3 + Math.cos(i) * 0.3;

    mesh.userData = {
      index: i,
      imgIndex: i % textures.length,
      angleX: angleX,
      angleY: angleY,
      radiusX: radiusX,
      radiusY: radiusY,
      progress: i / planeCount, // 0 to 1
      isHovered: false
    };

    galleryGroup.add(mesh);
    planes.push(mesh);
  }

  // Active interaction states
  let isEngaged = false;
  let scrollVelocity = 0.015;
  let targetVelocity = 0.015;
  let lastUserInteraction = Date.now();
  let hoveredMesh = null;
  let isVisible = true;
  let animId = null;

  // Toggle button logic
  if (engageBtn) {
    engageBtn.addEventListener('click', () => {
      isEngaged = !isEngaged;
      container.classList.toggle('is-engaged', isEngaged);
      engageBtn.setAttribute('aria-expanded', isEngaged);
      engageBtn.textContent = isEngaged ? 'Desarmar Galeria 3D (Esc)' : 'Explorar em 3D Interativo';
    });
  }

  // Wheel interaction: ONLY captures wheel when cursor is inside container AND gallery is engaged
  container.addEventListener('wheel', (e) => {
    if (!isEngaged) return; // Leave page scroll natural!
    e.preventDefault();
    targetVelocity += e.deltaY * 0.0006;
    lastUserInteraction = Date.now();
  }, { passive: false });

  // Keyboard navigation
  container.setAttribute('tabindex', '0');
  container.setAttribute('aria-label', 'Galeria 3D de bolos artesanais. Use setas para navegar.');
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isEngaged) {
      isEngaged = false;
      container.classList.remove('is-engaged');
      if (engageBtn) {
        engageBtn.setAttribute('aria-expanded', 'false');
        engageBtn.textContent = 'Explorar em 3D Interativo';
      }
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      targetVelocity += 0.04;
      lastUserInteraction = Date.now();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      targetVelocity -= 0.04;
      lastUserInteraction = Date.now();
    }
  });

  // Raycaster for Hover detection
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-999, -999);

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  });

  container.addEventListener('mouseleave', () => {
    mouse.set(-999, -999);
    if (hoveredMesh) {
      hoveredMesh.material.uniforms.isHovered.value = 0.0;
      hoveredMesh = null;
    }
  });

  // Section Observer for Performance
  const section = document.getElementById('galeria');
  let disposeTimeout = null;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        if (disposeTimeout) {
          clearTimeout(disposeTimeout);
          disposeTimeout = null;
        }
        startLoop();
      } else {
        stopLoop();
        // Lifecycle dispose safeguard if offscreen for > 6s
        disposeTimeout = setTimeout(() => {
          if (!isVisible) {
            // Suspended state
          }
        }, 6000);
      }
    });
  }, { threshold: 0.08 });

  if (section) observer.observe(section);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopLoop();
    } else if (isVisible) {
      startLoop();
    }
  });

  const clock = new THREE.Clock();

  function animate() {
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    // Autoplay fallback: return to gentle forward velocity after 3s
    if (Date.now() - lastUserInteraction > 3000) {
      targetVelocity = THREE.MathUtils.lerp(targetVelocity, 0.016, 0.04);
    }

    scrollVelocity = THREE.MathUtils.lerp(scrollVelocity, targetVelocity, 0.08);

    // Raycast hover
    if (container.classList.contains('is-engaged') || mouse.x > -1) {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(planes);
      if (intersects.length > 0) {
        const topMesh = intersects[0].object;
        if (hoveredMesh !== topMesh) {
          if (hoveredMesh) hoveredMesh.material.uniforms.isHovered.value = 0.0;
          hoveredMesh = topMesh;
        }
        hoveredMesh.material.uniforms.isHovered.value = 1.0;
      } else if (hoveredMesh) {
        hoveredMesh.material.uniforms.isHovered.value = 0.0;
        hoveredMesh = null;
      }
    }

    // Depth loop update
    planes.forEach((mesh) => {
      const u = mesh.userData;
      u.progress += scrollVelocity * 0.18;

      // Wrap around depth range
      if (u.progress > 1.0) {
        u.progress -= 1.0;
        u.imgIndex = (u.imgIndex + planes.length) % textures.length;
        mesh.material.uniforms.map.value = textures[u.imgIndex];
      } else if (u.progress < 0.0) {
        u.progress += 1.0;
        u.imgIndex = (u.imgIndex - planes.length + textures.length * 10) % textures.length;
        mesh.material.uniforms.map.value = textures[u.imgIndex];
      }

      // Calculate 3D position
      const p = u.progress;
      const currentZ = (1.0 - p) * depthRange - 12.0; // from -12 to +24
      const currentX = Math.sin(u.angleX + p * 3.0) * u.radiusX;
      const currentY = Math.cos(u.angleY + p * 2.0) * u.radiusY;

      mesh.position.set(currentX, currentY, currentZ);
      mesh.rotation.z = Math.sin(u.angleX + elapsed * 0.3) * 0.08;
      mesh.rotation.y = -currentX * 0.06;

      // Opacity Curve: fade in 0.05-0.25, fade out 0.40-0.43 in near view
      let op = 1.0;
      if (p < 0.15) {
        op = THREE.MathUtils.smoothstep(p, 0.02, 0.15);
      } else if (p > 0.38) {
        op = 1.0 - THREE.MathUtils.smoothstep(p, 0.38, 0.44);
      }
      mesh.material.uniforms.opacity.value = op;

      // Depth blur
      const distFromFocus = Math.abs(currentZ - 0.0);
      mesh.material.uniforms.blurAmount.value = THREE.MathUtils.clamp(distFromFocus * 0.12, 0.0, 1.8);
      mesh.material.uniforms.scrollForce.value = scrollVelocity * 25.0;
      mesh.material.uniforms.time.value = elapsed;
    });

    renderer.render(scene, camera);
  }

  function startLoop() {
    if (animId) return;
    renderer.setAnimationLoop(animate);
    animId = true;
  }

  function stopLoop() {
    renderer.setAnimationLoop(null);
    animId = null;
  }

  startLoop();

  // Resize handler
  window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
      container.style.display = 'none';
      if (fallbackGrid) fallbackGrid.style.display = 'grid';
      stopLoop();
    } else {
      container.style.display = 'block';
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      if (isVisible) startLoop();
    }
  }, { passive: true });
})();
