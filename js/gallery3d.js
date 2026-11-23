/* ==========================================================================
   FIDELES CONFEITARIA: 3D CYLINDRICAL INTERACTIVE CAKE GALLERY
   Three.js r128 — Smooth drag, touch scroll safety, card hover & direct order
   ========================================================================== */

'use strict';

(function init3DGallery() {
  const stage = document.getElementById('gallery-3d-stage');
  const titleDisplay = document.getElementById('gallery-active-title');
  const countDisplay = document.getElementById('gallery-active-count');
  const orderBtn = document.getElementById('gallery-order-btn');
  const prevBtn = document.getElementById('gallery-prev-btn');
  const nextBtn = document.getElementById('gallery-next-btn');

  if (!stage || typeof THREE === 'undefined') return;

  const items = [
    { title: 'Bolo Festivo Decorado', src: './assets/images/bolo-galeria-1-960.webp', desc: 'Acabamento acetinado com flores e detalhes artesanais.' },
    { title: 'Doces de Celebração', src: './assets/images/bolo-galeria-2-960.webp', desc: 'Doces finos com chocolate nobre e texturas delicadas.' },
    { title: 'Acabamento Artesanal', src: './assets/images/bolo-galeria-3-960.webp', desc: 'Decoração contemporânea com brilho e técnica apurada.' },
    { title: 'Bolo Temático Especial', src: './assets/images/bolo-galeria-4-960.webp', desc: 'Design exclusivo personalizado para o tema da sua festa.' },
    { title: 'Texturas & Detalhes', src: './assets/images/bolo-galeria-5-960.webp', desc: 'Harmonia entre massa leve, recheio cremoso e visual elegante.' },
    { title: 'Doces Finos Gourmet', src: './assets/images/bolo-galeria-6-960.webp', desc: 'Mesa de doces inesquecível para casamentos e aniversários.' },
    { title: 'Criação Personalizada', src: './assets/images/bolo-galeria-7-960.webp', desc: 'Bolo em camadas estruturado com sofisticação e sabor.' }
  ];

  const total = items.length;
  let activeIndex = 0;

  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, stage.clientWidth / stage.clientHeight, 0.1, 100);

  function updateCameraDistance() {
    const w = stage.clientWidth;
    if (w < 480) {
      camera.position.set(0, 0.1, 7.6);
    } else if (w < 768) {
      camera.position.set(0, 0.15, 6.8);
    } else {
      camera.position.set(0, 0.2, 6.0);
    }
    camera.aspect = stage.clientWidth / stage.clientHeight;
    camera.updateProjectionMatrix();
  }
  updateCameraDistance();

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: window.devicePixelRatio <= 1.5,
    powerPreference: 'high-performance'
  });
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  stage.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.95);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xFDF8EE, 0.85);
  dirLight.position.set(4, 5, 6);
  scene.add(dirLight);

  const goldSpot = new THREE.PointLight(0xC99728, 1.2, 12);
  goldSpot.position.set(0, 2, 4);
  scene.add(goldSpot);

  // Group containing all cards
  const carouselGroup = new THREE.Group();
  scene.add(carouselGroup);

  const radius = 3.6;
  const angleStep = (Math.PI * 2) / total;
  const cards = [];
  const cardGeometry = new THREE.PlaneGeometry(1.85, 2.45, 16, 16);
  const textureLoader = new THREE.TextureLoader();

  items.forEach((item, i) => {
    const geom = cardGeometry.clone();
    const pos = geom.attributes.position;
    for (let p = 0; p < pos.count; p++) {
      const x = pos.getX(p);
      pos.setZ(p, Math.sin((x / 1.85) * Math.PI) * 0.12);
    }
    geom.computeVertexNormals();

    const texture = textureLoader.load(item.src);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.35,
      metalness: 0.08,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geom, material);
    const angle = i * angleStep;

    mesh.position.x = Math.sin(angle) * radius;
    mesh.position.z = Math.cos(angle) * radius - radius;
    mesh.rotation.y = angle;

    mesh.userData = {
      index: i,
      title: item.title,
      desc: item.desc,
      baseScale: 1.0,
      targetScale: 1.0,
      targetY: 0
    };

    carouselGroup.add(mesh);
    cards.push(mesh);
  });

  // Rotation State & Physics
  let targetAngle = 0;
  let currentAngle = 0;
  let isDragging = false;
  let dragVelocity = 0;
  let lastX = 0;
  let autoRotateSpeed = 0.0012;
  let isUserInteracting = false;
  let interactionTimer = null;

  function updateActiveUI(idx) {
    activeIndex = (idx + total) % total;
    const item = items[activeIndex];
    if (titleDisplay) titleDisplay.textContent = item.title;
    if (countDisplay) countDisplay.textContent = `0${activeIndex + 1} / 0${total}`;
    if (orderBtn) {
      const msg = encodeURIComponent(`Olá Mônica! Vi o ${item.title} no site e gostaria de encomendar.`);
      orderBtn.href = `https://wa.me/5531973113229?text=${msg}`;
    }
  }
  updateActiveUI(0);

  function snapToNearest() {
    const rawIndex = Math.round(-targetAngle / angleStep);
    targetAngle = -rawIndex * angleStep;
    const normalizedIndex = ((rawIndex % total) + total) % total;
    updateActiveUI(normalizedIndex);
  }

  function rotateToIndex(idx) {
    const currentNearest = Math.round(-targetAngle / angleStep);
    let diff = idx - (((currentNearest % total) + total) % total);
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    targetAngle = -(currentNearest + diff) * angleStep;
    updateActiveUI(idx);
    markInteraction();
  }

  function markInteraction() {
    isUserInteracting = true;
    if (interactionTimer) clearTimeout(interactionTimer);
    interactionTimer = setTimeout(() => {
      isUserInteracting = false;
    }, 4500);
  }

  // --- MOUSE DRAG (DESKTOP) ---
  let isMouseDown = false;
  let mouseStartX = 0;

  stage.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    isDragging = true;
    mouseStartX = e.clientX;
    lastX = e.clientX;
    dragVelocity = 0;
    markInteraction();
    stage.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    const deltaX = e.clientX - lastX;
    lastX = e.clientX;
    dragVelocity = deltaX * 0.004;
    targetAngle += dragVelocity;
  });

  window.addEventListener('mouseup', () => {
    if (isMouseDown) {
      isMouseDown = false;
      isDragging = false;
      stage.style.cursor = 'grab';
      targetAngle += dragVelocity * 6;
      snapToNearest();
    }
  });

  // --- TOUCH EVENTS (SMART SCROLL SAFETY FOR MOBILE) ---
  let touchStartX = 0;
  let touchStartY = 0;
  let touchIsSwiping = false;
  let touchIsScrolling = false;

  stage.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    lastX = touchStartX;
    touchIsSwiping = false;
    touchIsScrolling = false;
    dragVelocity = 0;
  }, { passive: true });

  stage.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX;
    const diffY = currentY - touchStartY;

    if (!touchIsSwiping && !touchIsScrolling) {
      if (Math.abs(diffY) > 7 && Math.abs(diffY) > Math.abs(diffX)) {
        touchIsScrolling = true;
        return; // Allow native page scroll
      } else if (Math.abs(diffX) > 7 && Math.abs(diffX) > Math.abs(diffY)) {
        touchIsSwiping = true;
        isDragging = true;
        markInteraction();
      }
    }

    if (touchIsSwiping) {
      if (e.cancelable) e.preventDefault();
      const deltaX = currentX - lastX;
      lastX = currentX;
      dragVelocity = deltaX * 0.005;
      targetAngle += dragVelocity;
    }
  }, { passive: false });

  stage.addEventListener('touchend', () => {
    if (touchIsSwiping) {
      isDragging = false;
      targetAngle += dragVelocity * 6;
      snapToNearest();
    }
    touchIsSwiping = false;
    touchIsScrolling = false;
  }, { passive: true });

  // Wheel navigation
  stage.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      targetAngle -= e.deltaX * 0.003;
      markInteraction();
      snapToNearest();
    }
  }, { passive: false });

  // Buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      targetAngle += angleStep;
      snapToNearest();
      markInteraction();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      targetAngle -= angleStep;
      snapToNearest();
      markInteraction();
    });
  }

  // Raycaster for Hover & Click
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-999, -999);
  let hoveredCard = null;

  stage.addEventListener('mousemove', (e) => {
    const rect = stage.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  });

  stage.addEventListener('mouseleave', () => {
    mouse.set(-999, -999);
    if (hoveredCard) {
      hoveredCard.userData.targetScale = 1.0;
      hoveredCard.userData.targetY = 0;
      hoveredCard = null;
    }
  });

  stage.addEventListener('click', (e) => {
    if (Math.abs(e.clientX - mouseStartX) > 8) return;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(cards);
    if (hits.length > 0) {
      const clicked = hits[0].object;
      rotateToIndex(clicked.userData.index);
    }
  });

  // Render Loop
  let isVisible = true;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
    });
  }, { threshold: 0.05 });
  observer.observe(stage);

  function animate() {
    requestAnimationFrame(animate);
    if (!isVisible) return;

    if (!isDragging && !isUserInteracting) {
      targetAngle -= autoRotateSpeed;
    }

    currentAngle += (targetAngle - currentAngle) * 0.08;
    carouselGroup.rotation.y = currentAngle;

    // Hover detection
    if (!isDragging && mouse.x > -1) {
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(cards);
      if (hits.length > 0) {
        const topHit = hits[0].object;
        if (hoveredCard !== topHit) {
          if (hoveredCard) {
            hoveredCard.userData.targetScale = 1.0;
            hoveredCard.userData.targetY = 0;
          }
          hoveredCard = topHit;
        }
        hoveredCard.userData.targetScale = 1.1;
        hoveredCard.userData.targetY = 0.15;
      } else if (hoveredCard) {
        hoveredCard.userData.targetScale = 1.0;
        hoveredCard.userData.targetY = 0;
        hoveredCard = null;
      }
    }

    // Update cards scale & depth lighting
    cards.forEach((mesh) => {
      const u = mesh.userData;
      mesh.scale.lerp(new THREE.Vector3(u.targetScale, u.targetScale, 1), 0.1);
      mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, u.targetY, 0.1);

      const worldPos = new THREE.Vector3();
      mesh.getWorldPosition(worldPos);
      const distFromFront = (worldPos.z - 0.2);
      const brightness = THREE.MathUtils.clamp(1.0 + distFromFront * 0.15, 0.45, 1.0);
      mesh.material.color.setRGB(brightness, brightness * 0.98, brightness * 0.96);
    });

    renderer.render(scene, camera);
  }

  animate();

  // Resize handler
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      updateCameraDistance();
      renderer.setSize(stage.clientWidth, stage.clientHeight);
    }, 100);
  });

  // --- GALLERY VIEW SWITCHER (3D vs GRID) ---
  const switch3D = document.getElementById('view-mode-3d');
  const switchGrid = document.getElementById('view-mode-grid');
  const wrapper3D = document.querySelector('.gallery-3d-wrapper');
  const gridView = document.querySelector('.gallery-editorial-grid');

  if (switch3D && switchGrid && wrapper3D && gridView) {
    switch3D.addEventListener('click', () => {
      switch3D.classList.add('active');
      switchGrid.classList.remove('active');
      switch3D.setAttribute('aria-selected', 'true');
      switchGrid.setAttribute('aria-selected', 'false');
      wrapper3D.style.display = 'block';
      gridView.style.display = 'none';
      updateCameraDistance();
      renderer.setSize(stage.clientWidth, stage.clientHeight);
    });

    switchGrid.addEventListener('click', () => {
      switchGrid.classList.add('active');
      switch3D.classList.remove('active');
      switchGrid.setAttribute('aria-selected', 'true');
      switch3D.setAttribute('aria-selected', 'false');
      wrapper3D.style.display = 'none';
      gridView.style.display = 'grid';
    });
  }
})();
