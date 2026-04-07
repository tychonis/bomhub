import styles from "./threejs.module.css";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import * as MESH from "./mesh";

async function getModels(id: string): Promise<MESH.ModelDef[]> {
  const vector = [-0.2, 0, 0];
  const shift = new THREE.Vector3(vector[0], vector[1], vector[2]);
  if (
    id == "9fd2aa383af18a418375f7ae9b3cd3f6573190a4dadf4fb2321a686cd5b6e134"
  ) {
    const mesh: MESH.ModelDef[] = [
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
    return mesh;
  }
  const mesh: MESH.ModelDef[] = [
    { id: "right", path: "/dev/y-gantry-right.opt.glb", shift: shift },
    { id: "left", path: "/dev/y-gantry-left.opt.glb", shift: shift },
    { id: "x", path: "/dev/x-gantry.opt.glb", shift: shift },
  ];
  return mesh;
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
        MESH.loadModel(mesh, m.id, m.path, m.shift);
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
