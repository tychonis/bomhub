import styles from "./quaternion-indicator.module.css";
import { useEffect, useRef } from "react";
import * as THREE from "three";

type QuaternionLike =
  | THREE.Quaternion
  | {
      x: number;
      y: number;
      z: number;
      w: number;
    };

type QuaternionIndicatorProps = {
  quaternion: QuaternionLike | null;
};

export function QuaternionIndicator({ quaternion }: QuaternionIndicatorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const arrowGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    const camera = new THREE.OrthographicCamera(-1.4, 1.4, 1.4, -1.4, 0.1, 10);
    camera.position.set(2.2, 2.2, 2.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 1));

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.12,
        wireframe: true,
      })
    );
    scene.add(sphere);

    const arrowGroup = new THREE.Group();
    arrowGroupRef.current = arrowGroup;
    scene.add(arrowGroup);

    arrowGroup.add(
      new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, 0),
        1,
        0x1677ff,
        0.22,
        0.2
      )
    );
    arrowGroup.add(
      new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0),
        1,
        0xff1677,
        0.22,
        0.2
      )
    );
    arrowGroup.add(
      new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        1,
        0x77ff16,
        0.22,
        0.2
      )
    );

    renderer.render(scene, camera);

    const resizeObserver = new ResizeObserver(() => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.render(scene, camera);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const arrowGroup = arrowGroupRef.current;
    const renderer = rendererRef.current;
    if (!arrowGroup || !renderer || !quaternion) return;

    const q =
      quaternion instanceof THREE.Quaternion
        ? quaternion
        : new THREE.Quaternion(
            quaternion.x,
            quaternion.y,
            quaternion.z,
            quaternion.w
          );

    arrowGroup.quaternion.copy(q);
  }, [quaternion]);

  return <div ref={containerRef} className={styles["quaternion-indicator"]} />;
}
