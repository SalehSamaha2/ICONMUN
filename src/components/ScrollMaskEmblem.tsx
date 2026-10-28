import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const GOLD = 0xe8cba4;
const WINE = 0x641b2d;
const DARK = 0x16070c;

/**
 * Procedural 3D masquerade mask. This is actual extruded geometry with eye
 * cut-outs, bevels, a curved surface, raised gold filigree and scroll-driven
 * camera-facing motion — not a rotating flat logo.
 */
export const ScrollMaskEmblem: React.FC = () => {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      host.dataset.webgl = 'unavailable';
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(host.clientWidth || window.innerWidth, host.clientHeight || window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 12);

    scene.add(new THREE.AmbientLight(0xffe9d2, 2.0));
    const key = new THREE.DirectionalLight(0xffe0bb, 4.2);
    key.position.set(-4, 5, 8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9b304b, 3.2);
    rim.position.set(5, 1, -4);
    scene.add(rim);
    const fill = new THREE.PointLight(GOLD, 2.1, 18);
    fill.position.set(1, -3, 6);
    scene.add(fill);

    const rig = new THREE.Group();
    scene.add(rig);
    const mask = new THREE.Group();
    rig.add(mask);

    // Symmetric Venetian mask silhouette, drawn as one continuous closed shape.
    const outline = new THREE.Shape();
    outline.moveTo(-2.55, 0.62);
    outline.bezierCurveTo(-2.18, 1.22, -1.32, 1.34, -0.58, 1.08);
    outline.bezierCurveTo(-0.28, 0.98, -0.18, 0.8, 0, 0.7);
    outline.bezierCurveTo(0.18, 0.8, 0.28, 0.98, 0.58, 1.08);
    outline.bezierCurveTo(1.32, 1.34, 2.18, 1.22, 2.55, 0.62);
    outline.bezierCurveTo(2.4, 0.1, 2.18, -0.24, 1.8, -0.58);
    outline.bezierCurveTo(1.38, -0.96, 1.12, -1.38, 0.62, -1.48);
    outline.bezierCurveTo(0.38, -1.51, 0.23, -1.32, 0, -1.08);
    outline.bezierCurveTo(-0.23, -1.32, -0.38, -1.51, -0.62, -1.48);
    outline.bezierCurveTo(-1.12, -1.38, -1.38, -0.96, -1.8, -0.58);
    outline.bezierCurveTo(-2.18, -0.24, -2.4, 0.1, -2.55, 0.62);

    // Eye openings are true holes in the extruded mesh.
    const leftEye = new THREE.Path();
    leftEye.moveTo(-2.02, 0.43);
    leftEye.bezierCurveTo(-1.66, 0.78, -1.04, 0.78, -0.63, 0.43);
    leftEye.bezierCurveTo(-0.92, 0.12, -1.5, 0.04, -1.88, 0.24);
    leftEye.bezierCurveTo(-1.98, 0.29, -2.02, 0.36, -2.02, 0.43);
    outline.holes.push(leftEye);
    const rightEye = new THREE.Path();
    rightEye.moveTo(2.02, 0.43);
    rightEye.bezierCurveTo(1.66, 0.78, 1.04, 0.78, 0.63, 0.43);
    rightEye.bezierCurveTo(0.92, 0.12, 1.5, 0.04, 1.88, 0.24);
    rightEye.bezierCurveTo(1.98, 0.29, 2.02, 0.36, 2.02, 0.43);
    outline.holes.push(rightEye);

    const geometry = new THREE.ExtrudeGeometry(outline, {
      depth: 0.22, bevelEnabled: true, bevelSegments: 4,
      steps: 1, bevelSize: 0.075, bevelThickness: 0.075, curveSegments: 20,
    });
    // Bend the real mesh forward at the bridge and gently wrap its wings back.
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      positions.setZ(i, z + 0.34 * (1 - Math.min(1, Math.abs(x) / 2.6)) - 0.16 * Math.pow(x / 2.6, 2) + 0.045 * y);
    }
    geometry.computeVertexNormals();

    const maskMaterial = new THREE.MeshStandardMaterial({
      color: WINE, metalness: 0.68, roughness: 0.28,
      side: THREE.DoubleSide, emissive: 0x270812, emissiveIntensity: 0.45,
    });
    const shell = new THREE.Mesh(geometry, maskMaterial);
    mask.add(shell);

    // Fine champagne trim traces the upper brow and outer cheek lines in 3D.
    const makeLine = (points: THREE.Vector3[], radius = 0.018) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.TubeGeometry(curve, 72, radius, 8, false);
      const mat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.86, roughness: 0.2, emissive: 0x3a1b0c, emissiveIntensity: 0.28 });
      const mesh = new THREE.Mesh(geo, mat);
      mask.add(mesh);
      return mesh;
    };
    makeLine([
      new THREE.Vector3(-2.46, 0.64, 0.28), new THREE.Vector3(-1.9, 1.03, 0.34),
      new THREE.Vector3(-1.15, 1.08, 0.43), new THREE.Vector3(-0.55, 0.91, 0.51),
      new THREE.Vector3(0, 0.68, 0.56), new THREE.Vector3(0.55, 0.91, 0.51),
      new THREE.Vector3(1.15, 1.08, 0.43), new THREE.Vector3(1.9, 1.03, 0.34),
      new THREE.Vector3(2.46, 0.64, 0.28),
    ]);
    makeLine([
      new THREE.Vector3(-2.32, 0.34, 0.28), new THREE.Vector3(-2.02, -0.05, 0.32),
      new THREE.Vector3(-1.55, -0.58, 0.38), new THREE.Vector3(-0.7, -1.26, 0.43),
      new THREE.Vector3(-0.22, -0.98, 0.52), new THREE.Vector3(0, -0.65, 0.56),
      new THREE.Vector3(0.22, -0.98, 0.52), new THREE.Vector3(0.7, -1.26, 0.43),
      new THREE.Vector3(1.55, -0.58, 0.38), new THREE.Vector3(2.02, -0.05, 0.32),
      new THREE.Vector3(2.32, 0.34, 0.28),
    ], 0.012);

    // Raised central nose ridge and delicate ornamental brow flourishes.
    makeLine([new THREE.Vector3(0, 0.69, 0.62), new THREE.Vector3(-0.09, 0.26, 0.68), new THREE.Vector3(0, -0.2, 0.72), new THREE.Vector3(0.11, -0.65, 0.65)], 0.035);
    for (const side of [-1, 1]) {
      const flourish = new THREE.Group();
      mask.add(flourish);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.63, 0.76, 0.5),
        new THREE.Vector3(side * 0.94, 0.91, 0.47),
        new THREE.Vector3(side * 1.28, 0.83, 0.42),
        new THREE.Vector3(side * 1.42, 0.62, 0.4),
      ]);
      flourish.add(new THREE.Mesh(
        new THREE.TubeGeometry(curve, 32, 0.018, 8, false),
        new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.9, roughness: 0.18 })
      ));
      const gem = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 18, 12),
        new THREE.MeshStandardMaterial({ color: 0x9b304b, metalness: 0.55, roughness: 0.2, emissive: 0x3d0717, emissiveIntensity: 0.55 })
      );
      gem.position.set(side * 1.45, 0.56, 0.43);
      mask.add(gem);
    }

    // Small gold edge studs, kept subtle and symmetrical.
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const stud = new THREE.Mesh(
          new THREE.SphereGeometry(0.035, 12, 10),
          new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.95, roughness: 0.18 })
        );
        stud.position.set(side * (1.75 + i * 0.16), 0.02 - i * 0.2, 0.34 - i * 0.025);
        mask.add(stud);
      }
    }

    // Floating rings add scale, while the mask itself responds to scroll.
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.24 });
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(3.18, 0.008, 8, 180), orbitMaterial);
    orbit.rotation.set(1.13, 0.18, -0.14);
    rig.add(orbit);
    const orbit2 = new THREE.Mesh(new THREE.TorusGeometry(2.78, 0.006, 8, 180), new THREE.MeshBasicMaterial({ color: 0x9b304b, transparent: true, opacity: 0.42 }));
    orbit2.rotation.set(1.0, -0.36, 0.28);
    rig.add(orbit2);

    const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    let latestScroll = window.scrollY;
    let raf = 0;
    const resize = () => {
      const width = Math.max(1, host.clientWidth || window.innerWidth);
      const height = Math.max(1, host.clientHeight || window.innerHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = width < 700 ? 38 : 32;
      camera.updateProjectionMatrix();
      render();
    };
    const render = () => {
      raf = 0;
      const progress = THREE.MathUtils.clamp(latestScroll / maxScroll(), 0, 1);
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const t = reduced ? 0 : progress;
      // Reveal changing perspective over the full page; it is not a flat 360° spin.
      mask.rotation.y = -0.28 + Math.sin(t * Math.PI * 2.2) * 0.48;
      mask.rotation.x = 0.08 + Math.sin(t * Math.PI * 1.4) * 0.14;
      mask.rotation.z = Math.sin(t * Math.PI * 2) * 0.035;
      mask.position.y = Math.sin(t * Math.PI * 2) * 0.12;
      rig.rotation.z = reduced ? 0 : Math.sin(t * Math.PI * 2) * 0.025;
      orbit.rotation.z = -0.14 + t * 0.32;
      orbit2.rotation.y = -0.36 + t * 0.22;
      renderer.render(scene, camera);
    };
    const onScroll = () => { latestScroll = window.scrollY; if (!raf) raf = requestAnimationFrame(render); };
    const onLenis = (event: Event) => {
      const detail = (event as CustomEvent<{ scroll?: number }>).detail;
      if (typeof detail?.scroll === 'number') latestScroll = detail.scroll;
      if (!raf) raf = requestAnimationFrame(render);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('icon-mun-scroll', onLenis);
    window.addEventListener('resize', resize, { passive: true });
    resize();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('icon-mun-scroll', onLenis);
      window.removeEventListener('resize', resize);
      if (raf) cancelAnimationFrame(raf);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      style={{ opacity: 0.92, mixBlendMode: 'screen' }}
    />
  );
};

export default ScrollMaskEmblem;
