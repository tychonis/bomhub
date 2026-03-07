import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function MeshViewer() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 0, 0.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(5, 5, 6);
    scene.add(directionalLight);

    const loader = new GLTFLoader();

    loader.load(
      "/dev/test.gltf", // place model.glb in your public folder
      (gltf) => {
        const mesh = gltf.scene;
        scene.add(mesh);

        // center the model
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        mesh.position.sub(center);
        renderer.render(scene, camera);
      },
      undefined,
      (error) => {
        console.error("Error loading model:", error);
      }
    );

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
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }

      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "420px",
        border: "1px solid #ccc",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    />
  );
}
