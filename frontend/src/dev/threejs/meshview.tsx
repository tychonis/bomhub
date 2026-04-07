import styles from "./threejs.module.css";

import { useEffect, useRef } from "react";
import * as MESH from "./mesh";

export function MeshView(props: { models: MESH.ModelDef[] }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cameraControlRefs = useRef({
    azimuth: null as HTMLInputElement | null,
    elevation: null as HTMLInputElement | null,
    zoomIn: null as HTMLButtonElement | null,
    zoomOut: null as HTMLButtonElement | null,
  });

  useEffect(() => {
    const mount = mountRef.current;
    const cameraCtrl = cameraControlRefs.current;

    if (!mount || !cameraCtrl) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 420;

    const mesh = MESH.createDefaultMesh(width, height);

    mount.appendChild(mesh.renderer.domElement);

    for (const m of props.models) {
      MESH.loadModel(mesh, m.id, m.path, m.shift);
    }

    const hoverControl = MESH.createHoverController(mesh);
    const cameraControl = MESH.createCameraControls(
      mesh,
      cameraControlRefs.current
    );

    hoverControl.attach();
    cameraControl.attach();

    const handleResize = () => {
      const newWidth = mount.clientWidth || 600;
      const newHeight = mount.clientHeight || 420;
      mesh.camera.aspect = newWidth / newHeight;
      mesh.camera.updateProjectionMatrix();
      mesh.renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    return () => {
      hoverControl.detach();
      cameraControl.detach();
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();

      if (mesh.renderer.domElement.parentNode === mount) {
        mount.removeChild(mesh.renderer.domElement);
      }
      MESH.dispose(mesh);
    };
  }, []);

  const setRef =
    <K extends keyof MESH.CameraControlsRefs>(key: K) =>
    (el: MESH.CameraControlsRefs[K]) => {
      cameraControlRefs.current[key] = el;
    };

  return (
    <div className={styles["viewer-container"]}>
      <div className={styles["viewer-grid"]}>
        <div ref={mountRef} className={styles["viewer"]}>
          <div className={styles["zoom-control"]}>
            <button ref={setRef("zoomOut")}>-</button>
            <button ref={setRef("zoomIn")}>+</button>
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
            ref={setRef("elevation")}
            type="range"
            min="-80"
            max="80"
            defaultValue="0"
          />
        </label>

        <label>
          <input
            className={styles["scroll"]}
            ref={setRef("azimuth")}
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
