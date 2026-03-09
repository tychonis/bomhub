import styles from "./threejs.module.css";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

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

export function NutView() {
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

    const cameraRadius = 0.1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 100);
    camera.position.set(0, 0, 0.1);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    directionalLight.position.set(5, 5, 6);
    scene.add(directionalLight);

    const meshes: THREE.Object3D[] = [];

    const loader = new GLTFLoader();

    loader.load(
      "/dev/nut.glb", // place model.glb in your public folder
      (gltf) => {
        const mesh = gltf.scene;
        scene.add(mesh);

        // center the model
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        mesh.position.sub(center);
        mesh.position.add(new THREE.Vector3(0.01, 0, 0));
        meshes.push(mesh);
        renderer.render(scene, camera);
      },
      undefined,
      (error) => {
        console.error("Error loading model:", error);
      }
    );
    loader.load(
      "/dev/nut.glb", // place model.glb in your public folder
      (gltf) => {
        const mesh = gltf.scene;
        scene.add(mesh);

        // center the model
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        mesh.position.sub(center);
        mesh.position.add(new THREE.Vector3(-0.01, 0, 0));
        meshes.push(mesh);
        renderer.render(scene, camera);
      },
      undefined,
      (error) => {
        console.error("Error loading model:", error);
      }
    );

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
      const hits = raycaster.intersectObjects(meshes, true);

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

    updateCamera();
    render();

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
        <div ref={mountRef} className={styles["viewer"]} />
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.25rem",
            width: "1.5rem",
          }}
        >
          <input
            className={styles["scroll"]}
            ref={elevationRef}
            type="range"
            min="-80"
            max="80"
            defaultValue="0"
            style={{
              width: "28rem",
              transform: "rotate(-90deg)",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 4, marginTop: "0.25rem" }}>
          <input
            className={styles["scroll"]}
            ref={azimuthRef}
            type="range"
            min="-180"
            max="180"
            defaultValue="0"
          />
        </label>
      </div>
    </div>
  );
}
