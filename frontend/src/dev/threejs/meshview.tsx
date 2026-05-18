import styles from "./threejs.module.css";

import bomhub from "api/ky";
import { API_ROOT } from "api/constants";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import * as MESH from "components/threejs/mesh";

async function getModels(id: string): Promise<MESH.ModelDef[]> {
  const rawModelDef = await bomhub.get(`${API_ROOT}/models/${id}`).json();
  const ret: MESH.ModelDef[] = [];

  for (const def of rawModelDef) {
    ret.push({
      id: def.id,
      path: def.path,
      rotation: new THREE.Quaternion().fromArray(def.rotation),
      shift: new THREE.Vector3().fromArray(def.placement),
    });
  }
  return ret;
}

export function MeshView(props: {
  selectedID: string;
  setSelectedID: React.Dispatch<React.SetStateAction<string>>;
}) {
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

    getModels(props.selectedID).then((models) => {
      for (const m of models) {
        MESH.loadModel(mesh, m.id, m.path, m.rotation, m.shift);
      }
    });

    const hoverControl = MESH.createHoverController(mesh, props.setSelectedID);
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
  }, [props.selectedID, props.setSelectedID]);

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
