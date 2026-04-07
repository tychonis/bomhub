import styles from "./threejs.module.css";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import * as MESH from "./mesh";

export function MeshView() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const azimuthRef = useRef<HTMLInputElement | null>(null);
  const elevationRef = useRef<HTMLInputElement | null>(null);
  const zoomInRef = useRef<HTMLButtonElement | null>(null);
  const zoomOutRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const azimuthInput = azimuthRef.current;
    const elevationInput = elevationRef.current;
    const zoomInButton = zoomInRef.current;
    const zoomOutButton = zoomOutRef.current;

    if (
      !mount ||
      !azimuthInput ||
      !elevationInput ||
      !zoomInButton ||
      !zoomOutButton
    )
      return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 420;

    const mesh = MESH.createDefaultMesh(width, height);
    let cameraRadius = 0.5;

    mount.appendChild(mesh.renderer.domElement);

    const shift = new THREE.Vector3(-0.2, 0, 0);
    const models: MESH.ModelDef[] = [
      { id: "right", path: "/dev/y-gantry-right.opt.glb", shift: shift },
      { id: "left", path: "/dev/y-gantry-left.opt.glb", shift: shift },
      { id: "x", path: "/dev/x-gantry.opt.glb", shift: shift },
      { id: "front", path: "/dev/front-feeder-rail.opt.glb", shift: shift },
      { id: "rear", path: "/dev/rear-feeder-rail.opt.glb", shift: shift },
      { id: "build", path: "/dev/build-plate.opt.glb", shift: shift },
      { id: "staging", path: "/dev/staging-plate.opt.glb", shift: shift },
      { id: "control", path: "/dev/control-box.opt.glb", shift: shift },
      { id: "x-chain", path: "/dev/x-drag-chain.opt.glb", shift: shift },
      { id: "y-chain", path: "/dev/y-drag-chain.opt.glb", shift: shift },
      { id: "y-limit", path: "/dev/y-limit-striker.opt.glb", shift: shift },
    ];
    for (const m of models) {
      MESH.loadModel(mesh, m.id, m.path, m.shift);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered: THREE.Mesh | null = null;

    const updateMesh = () => {
      const azimuth = THREE.MathUtils.degToRad(Number(azimuthInput.value));
      const elevation = THREE.MathUtils.degToRad(Number(elevationInput.value));

      MESH.updateCamera(mesh, cameraRadius, azimuth, elevation);
    };

    const zoomIn = () => {
      cameraRadius = cameraRadius / 2;
      updateMesh();
    };

    const zoomOut = () => {
      cameraRadius = cameraRadius * 2;
      updateMesh();
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = mesh.renderer.domElement.getBoundingClientRect();

      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, mesh.camera);
      const hits = raycaster.intersectObjects(mesh.objects, true);

      const nextHovered =
        hits.length > 0 ? (hits[0].object as THREE.Mesh) : null;

      if (hovered !== nextHovered) {
        if (hovered) MESH.setHighlight(hovered, false);
        hovered = nextHovered;
        if (hovered) {
          MESH.setHighlight(hovered, true);
          console.log(MESH.findObjectId(hovered));
        }
        MESH.render(mesh);
      }
    };

    const handlePointerLeave = () => {
      if (hovered) {
        MESH.setHighlight(hovered, false);
        hovered = null;
        MESH.render(mesh);
      }
    };

    const handleSliderInput = () => {
      updateMesh();
    };

    const handleResize = () => {
      const newWidth = mount.clientWidth || 600;
      const newHeight = mount.clientHeight || 420;
      mesh.camera.aspect = newWidth / newHeight;
      mesh.camera.updateProjectionMatrix();
      mesh.renderer.setSize(newWidth, newHeight);
    };

    updateMesh();
    MESH.render(mesh);

    mesh.renderer.domElement.addEventListener("pointermove", handlePointerMove);
    mesh.renderer.domElement.addEventListener(
      "pointerleave",
      handlePointerLeave
    );
    azimuthInput.addEventListener("input", handleSliderInput);
    elevationInput.addEventListener("input", handleSliderInput);
    zoomInButton.addEventListener("click", zoomIn);
    zoomOutButton.addEventListener("click", zoomOut);

    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    return () => {
      mesh.renderer.domElement.removeEventListener(
        "pointermove",
        handlePointerMove
      );
      mesh.renderer.domElement.removeEventListener(
        "pointerleave",
        handlePointerLeave
      );
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();

      if (mesh.renderer.domElement.parentNode === mount) {
        mount.removeChild(mesh.renderer.domElement);
      }

      mesh.renderer.dispose();

      mesh.scene.traverse((object) => {
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
    <div className={styles["viewer-container"]}>
      <div className={styles["viewer-grid"]}>
        <div ref={mountRef} className={styles["viewer"]}>
          <div className={styles["zoom-control"]}>
            <button ref={zoomOutRef}>-</button>
            <button ref={zoomInRef}>+</button>
          </div>
        </div>
        <label
          style={{
            justifyContent: "center",
            width: "1.5rem",
          }}
        >
          <input
            className={`${styles["scroll"]} ${styles["vertical"]}`}
            ref={elevationRef}
            type="range"
            min="-80"
            max="80"
            defaultValue="0"
          />
        </label>

        <label>
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
