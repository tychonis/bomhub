import styles from "./threejs.module.css";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

type ModelDef = {
  id: string;
  path: string;
  shift?: THREE.Vector3;
};

type Mesh = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
};

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

const createDefaultMesh = (width: number, height: number): Mesh => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
  directionalLight.position.set(5, 5, 6);
  scene.add(directionalLight);

  return { scene, camera, renderer };
};

const render = (m: Mesh) => {
  m.renderer.render(m.scene, m.camera);
};

const updateCamera = (
  m: Mesh,
  cameraRadius: number,
  azimuth: number,
  elevation: number
) => {
  const horizontalRadius = cameraRadius * Math.cos(elevation);
  m.camera.position.x = horizontalRadius * Math.sin(azimuth);
  m.camera.position.y = cameraRadius * Math.sin(elevation);
  m.camera.position.z = horizontalRadius * Math.cos(azimuth);
  m.camera.lookAt(0, 0, 0);

  render(m);
};

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

    const mesh = createDefaultMesh(width, height);

    let cameraRadius = 0.5;

    mount.appendChild(mesh.renderer.domElement);

    const objects: THREE.Object3D[] = [];

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/libs/draco/"
    );
    loader.setDRACOLoader(dracoLoader);

    function findObjectId(obj: THREE.Object3D | null): string | undefined {
      while (obj) {
        if (obj.userData?.id) return obj.userData.id;
        obj = obj.parent;
      }
      return undefined;
    }

    function loadModel(id: string, filename: string, position: THREE.Vector3) {
      if (!position) {
        position = new THREE.Vector3(0, 0, 0);
      }
      loader.load(
        filename,
        (gltf) => {
          const object = gltf.scene;
          object.userData.id = id;

          mesh.scene.add(object);

          // const box = new THREE.Box3().setFromObjects(object);
          // const center = box.getCenter(new THREE.Vector3());
          // object.position.sub(center);
          object.position.add(position);

          objects.push(object);
          render(mesh);
        },
        undefined,
        (error) => {
          console.error("Error loading model:", error);
        }
      );
    }

    const shift = new THREE.Vector3(-0.2, 0, 0);
    const models: ModelDef[] = [
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
      loadModel(m.id, m.path, m.shift);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered: THREE.Mesh | null = null;

    const updateMesh = () => {
      const azimuth = THREE.MathUtils.degToRad(Number(azimuthInput.value));
      const elevation = THREE.MathUtils.degToRad(Number(elevationInput.value));

      updateCamera(mesh, cameraRadius, azimuth, elevation);
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
      const hits = raycaster.intersectObjects(objects, true);

      const nextHovered =
        hits.length > 0 ? (hits[0].object as THREE.Mesh) : null;

      if (hovered !== nextHovered) {
        if (hovered) setHighlight(hovered, false);
        hovered = nextHovered;
        if (hovered) {
          setHighlight(hovered, true);
          console.log(findObjectId(hovered));
        }
        render(mesh);
      }
    };

    const handlePointerLeave = () => {
      if (hovered) {
        setHighlight(hovered, false);
        hovered = null;
        render(mesh);
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
    render(mesh);

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
