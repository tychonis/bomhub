import { useEffect, useRef } from "react";
import * as THREE from "three";

export function MagicCube() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(3, 3, 6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    directionalLight.position.set(5, 8, 6);
    scene.add(directionalLight);

    const cubieSize = 0.9;
    const gap = 0.08;
    const offset = cubieSize + gap;

    const stickerMaterials = {
      right: new THREE.MeshStandardMaterial({ color: 0xff6b00 }),
      left: new THREE.MeshStandardMaterial({ color: 0xff0000 }),
      top: new THREE.MeshStandardMaterial({ color: 0xffffff }),
      bottom: new THREE.MeshStandardMaterial({ color: 0xffff00 }),
      front: new THREE.MeshStandardMaterial({ color: 0x00aa00 }),
      back: new THREE.MeshStandardMaterial({ color: 0x0000ff }),
      inner: new THREE.MeshStandardMaterial({ color: 0x000000 }),
    };

    const cubeGroup = new THREE.Group();
    scene.add(cubeGroup);

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const geometry = new THREE.BoxGeometry(
            cubieSize,
            cubieSize,
            cubieSize
          );
          const materials = [
            x === 1 ? stickerMaterials.right : stickerMaterials.inner,
            x === -1 ? stickerMaterials.left : stickerMaterials.inner,
            y === 1 ? stickerMaterials.top : stickerMaterials.inner,
            y === -1 ? stickerMaterials.bottom : stickerMaterials.inner,
            z === 1 ? stickerMaterials.front : stickerMaterials.inner,
            z === -1 ? stickerMaterials.back : stickerMaterials.inner,
          ];

          const cubie = new THREE.Mesh(geometry, materials);
          cubie.position.set(x * offset, y * offset, z * offset);
          cubeGroup.add(cubie);
        }
      }
    }

    renderer.render(scene, camera);

    // let animationFrameId = 0;

    // let lastTime = 0;

    // const animate = (time: number) => {
    //   requestAnimationFrame(animate);

    //   const delta = (time - lastTime) / 1000;
    //   lastTime = time;

    //   cubeGroup.rotation.x += delta * 0.5;
    //   cubeGroup.rotation.y += delta * 0.7;

    //   renderer.render(scene, camera);
    // };

    // requestAnimationFrame(animate);

    const handleResize = () => {
      const newWidth = mount.clientWidth || 600;
      const newHeight = mount.clientHeight || 420;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    return () => {
      //   window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }

      renderer.dispose();

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) {
            material.forEach((m) => m.dispose());
          } else {
            material.dispose();
          }
        }
      });
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "800px",
        border: "1px solid #ddd",
        borderRadius: "16px",
        background: "#fff",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      <h2
        style={{
          margin: "0 0 8px 0",
          fontSize: "20px",
          fontWeight: 600,
        }}
      >
        Three.js magic cube
      </h2>

      <p
        style={{
          margin: "0 0 16px 0",
          fontSize: "14px",
          color: "#666",
        }}
      >
        A minimal React + Three.js example without Tailwind.
      </p>

      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: "420px",
          border: "1px solid #ddd",
          borderRadius: "12px",
          overflow: "hidden",
          background: "#f3f3f3",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
