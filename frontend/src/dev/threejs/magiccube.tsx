import styles from "./threejs.module.css";

import { useEffect, useRef } from "react";
import * as THREE from "three";

function setHighlight(mesh: THREE.Mesh, on: boolean) {
  const materials = Array.isArray(mesh.material)
    ? mesh.material
    : [mesh.material];

  for (const material of materials) {
    if (material instanceof THREE.MeshStandardMaterial) {
      material.emissive.setHex(on ? 0x555555 : 0x000000);
    }
  }
}

export function MagicCube() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const azimuthRef = useRef<HTMLInputElement | null>(null);
  const elevationRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const azimuthInput = azimuthRef.current;
    const elevationInput = elevationRef.current;
    if (!mount || !azimuthInput || !elevationInput) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 420;

    const cameraRadius = 6;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(3, -3, 5);
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

    const makeMaterial = (color: number) => () =>
      new THREE.MeshStandardMaterial({ color });

    const stickerMaterials = {
      right: makeMaterial(0xff6b00),
      left: makeMaterial(0xff0000),
      top: makeMaterial(0xffffff),
      bottom: makeMaterial(0xffff00),
      front: makeMaterial(0x00aa00),
      back: makeMaterial(0x0000ff),
      inner: makeMaterial(0x000000),
    };

    const cubeGroup = new THREE.Group();
    const cubies: THREE.Mesh[] = [];
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
            x === 1 ? stickerMaterials.right() : stickerMaterials.inner(),
            x === -1 ? stickerMaterials.left() : stickerMaterials.inner(),
            y === 1 ? stickerMaterials.top() : stickerMaterials.inner(),
            y === -1 ? stickerMaterials.bottom() : stickerMaterials.inner(),
            z === 1 ? stickerMaterials.front() : stickerMaterials.inner(),
            z === -1 ? stickerMaterials.back() : stickerMaterials.inner(),
          ];

          const cubie = new THREE.Mesh(geometry, materials);
          cubie.position.set(x * offset, y * offset, z * offset);
          cubeGroup.add(cubie);
          cubies.push(cubie);
        }
      }
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered: THREE.Mesh | null = null;

    function render() {
      renderer.render(scene, camera);
    }

    function updateCamera() {
      const azimuth = THREE.MathUtils.degToRad(Number(azimuthInput.value));
      const elevation = THREE.MathUtils.degToRad(Number(elevationInput.value));

      const horizontalRadius = cameraRadius * Math.cos(elevation);
      camera.position.x = horizontalRadius * Math.sin(azimuth);
      camera.position.y = cameraRadius * Math.sin(elevation);
      camera.position.z = horizontalRadius * Math.cos(azimuth);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();

      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(cubies, false);

      const nextHovered =
        hits.length > 0 ? (hits[0].object as THREE.Mesh) : null;

      if (hovered !== nextHovered) {
        if (hovered) setHighlight(hovered, false);
        hovered = nextHovered;
        if (hovered) setHighlight(hovered, true);
        render();
      }
    };

    const handlePointerLeave = () => {
      if (hovered) {
        setHighlight(hovered, false);
        hovered = null;
        render();
      }
    };

    const handleSliderInput = () => {
      updateCamera();
    };

    render();

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

    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
    azimuthInput.addEventListener("input", handleSliderInput);
    elevationInput.addEventListener("input", handleSliderInput);
    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    return () => {
      //   window.cancelAnimationFrame(animationFrameId);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener(
        "pointerleave",
        handlePointerLeave
      );
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
      <div className={styles["viewer-grid"]}>
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
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: 48,
          }}
        >
          <input
            className={styles["scroll"]}
            ref={elevationRef}
            type="range"
            min="-80"
            max="80"
            defaultValue="25"
            style={{
              width: "26rem",
              transform: "rotate(-90deg)",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 4, marginTop: "0.5 rem" }}>
          <input
            className={styles["scroll"]}
            ref={azimuthRef}
            type="range"
            min="-180"
            max="180"
            defaultValue="35"
          />
        </label>
      </div>
    </div>
  );
}
