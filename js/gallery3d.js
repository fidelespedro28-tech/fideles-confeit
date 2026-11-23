/* ==========================================================================
   FIDELES CONFEITARIA: 3D CYLINDRICAL INTERACTIVE CAKE GALLERY
   Three.js r128 — Smooth drag, wheel navigation, card hover & direct order
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
  camera.position.set(0, 0.2, 6.2);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: window.devicePixelRatio <= 1.5,
    powerPreference: 'high-performance'
  });
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  stage.appendChild(renderer.domElement);

  // Lighting for rich 3D cards
  const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.95);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xFDF8EE, 0.8);
  dirLight.position.set(4, 5, 6);
  scene.add(dirLight);

  const goldSpot = new THREE.PointLight(0xC99728, 1.2, 10);
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
    // Curved card geometry for luxury tactile feel
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
      metalness: 0.1,
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

  // Position carousel center so active item sits near camera
  carouselGroup.position.z = 0;

  // Rotation State & Physics
  let targetAngle = 0;
  let currentAngle = 0;
  let isDragging = false;
  let startX = 0;
  let dragVelocity = 0;
  let lastX = 0;
  let autoRotateSpeed = 0.0015;
  let isUserInteracting = false;
  let interactionTimer = null;

  function updateActiveUI(idx) {
    activeIndex = (idx + total) % total;
    const item = items[activeIndex];
    if (titleDisplay) titleDisplay.textContent = item.title;
    if (countDisplay) countDisplay.textContent = `0${activeIndex + 1} / 0${total}`;
    if (orderBtn) {
      const msg = encodeURIComponent(`Olá Mônica! Vi o ${item.title} no site e gostaria de saber mais sobre encomendas.`);
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
    }, 4000);
  }

  // Pointer drag events
  stage.addEventListener('pointerdown', (e) => {
    isDragging = true;
    startX = e.clientX;
    lastX = e.clientX;
    dragVelocity = 0;
    markInteraction();
    stage.style.cursor = 'grabbing';
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastX;
    lastX = e.clientX;
    dragVelocity = deltaX * 0.004;
    targetAngle += dragVelocity;
  });

  window.addEventListener('pointerup', () => {
    if (isDragging) {
      isDragging = false;
      stage.style.cursor = 'grab';
      targetAngle += dragVelocity * 6;
      snapToNearest();
    }
  });

  // Wheel event on gallery stage
  stage.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      targetAngle -= e.deltaX * 0.003;
      markInteraction();
      snapToNearest();
    } else if (e.shiftKey) {
      e.preventDefault();
      targetAngle -= e.deltaY * 0.003;
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
    if (Math.abs(e.clientX - startX) > 10) return; // Ignore drag clicks
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
  }, { threshold: 0.1 });
  observer.observe(stage);

  function animate() {
    requestAnimationFrame(animate);
    if (!isVisible) return;

    if (!isDragging && !isUserInteracting) {
      targetAngle -= autoRotateSpeed;
    }

    // Smooth lerp rotation
    currentAngle += (targetAngle - currentAngle) * 0.08;
    carouselGroup.rotation.y = currentAngle;

    // Raycast check
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
        hoveredCard.userData.targetScale = 1.12;
        hoveredCard.userData.targetY = 0.18;
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

      // Cards further back are softly dimmed for realistic depth
      const worldPos = new THREE.Vector3();
      mesh.getWorldPosition(worldPos);
      const distFromFront = (worldPos.z - 0.2); // front card is at highest z
      const brightness = THREE.MathUtils.clamp(1.0 + distFromFront * 0.15, 0.45, 1.0);
      mesh.material.color.setRGB(brightness, brightness * 0.98, brightness * 0.96);
    });

    renderer.render(scene, camera);
  }

  animate();

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = stage.clientWidth / stage.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(stage.clientWidth, stage.clientHeight);
  });
})();
