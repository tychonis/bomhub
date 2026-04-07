import * as THREE from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

export type ModelDef = {
  id: string;
  path: string;
  shift?: THREE.Vector3;
};

export type Mesh = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  loader: GLTFLoader;
  objects: THREE.Object3D[];
};

export function findObjectId(obj: THREE.Object3D | null): string | undefined {
  while (obj) {
    if (obj.userData?.id) return obj.userData.id;
    obj = obj.parent;
  }
  return undefined;
}

export function setHighlight(mesh: THREE.Mesh, on: boolean) {
  const materials = Array.isArray(mesh.material)
    ? mesh.material
    : [mesh.material];

  for (const material of materials) {
    if (material instanceof THREE.MeshStandardMaterial) {
      material.emissive.setHex(on ? 0x555555 : 0x000000);
    }
  }
}

export const createDefaultMesh = (width: number, height: number): Mesh => {
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

  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/libs/draco/"
  );
  loader.setDRACOLoader(dracoLoader);

  const objects: THREE.Object3D[] = [];

  return { scene, camera, renderer, loader, objects };
};

export const render = (m: Mesh) => {
  m.renderer.render(m.scene, m.camera);
};

export const dispose = (m: Mesh) => {
  m.renderer.dispose();

  m.scene.traverse((object) => {
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

export const updateCamera = (
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

export const loadModel = (
  mesh: Mesh,
  id: string,
  filename: string,
  position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
) => {
  mesh.loader.load(
    filename,
    (gltf) => {
      const object = gltf.scene;
      object.userData.id = id;

      mesh.scene.add(object);

      // const box = new THREE.Box3().setFromObjects(object);
      // const center = box.getCenter(new THREE.Vector3());
      // object.position.sub(center);
      object.position.add(position);

      mesh.objects.push(object);
      render(mesh);
    },
    undefined,
    (error) => {
      console.error("Error loading model:", error);
    }
  );
};

export type InteractionState = {
  hovered: THREE.Mesh | null;
  // selected: THREE.Mesh | null;
};

export type HoverController = {
  attach: () => void;
  detach: () => void;
};

export const createHoverController = (mesh: Mesh) => {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let hovered: THREE.Mesh | null = null;
  // let selected: THREE.Mesh | null = null;

  const updateHover = (nextHovered: THREE.Mesh | null) => {
    if (hovered === nextHovered) return;

    if (hovered) setHighlight(hovered, false);
    hovered = nextHovered;
    if (hovered) setHighlight(hovered, true);

    render(mesh);
  };

  const pointerEventObject = (event: PointerEvent) => {
    const rect = mesh.renderer.domElement.getBoundingClientRect();

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, mesh.camera);
    const hits = raycaster.intersectObjects(mesh.objects, true);
    return hits.length > 0 ? (hits[0].object as THREE.Mesh) : null;
  };

  const handlePointerMove = (event: PointerEvent) => {
    const nextHovered = pointerEventObject(event);
    updateHover(nextHovered);
  };

  const handleClick = (event: PointerEvent) => {
    const clicked = pointerEventObject(event);
    console.log(findObjectId(clicked));
  };

  const handlePointerLeave = () => {
    updateHover(null);
  };

  const el = mesh.renderer.domElement;

  return {
    attach() {
      el.addEventListener("pointermove", handlePointerMove);
      el.addEventListener("pointerleave", handlePointerLeave);
      el.addEventListener("click", handleClick);
    },

    detach() {
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerleave", handlePointerLeave);
      el.removeEventListener("click", handleClick);
    },
  };
};

export type CameraControlsRefs = {
  azimuth: HTMLInputElement | null;
  elevation: HTMLInputElement | null;
  zoomIn: HTMLButtonElement | null;
  zoomOut: HTMLButtonElement | null;
};

export const createCameraControls = (mesh: Mesh, refs: CameraControlsRefs) => {
  let cameraRadius = 0.5;

  const updateMesh = () => {
    const azimuth = THREE.MathUtils.degToRad(Number(refs.azimuth.value));
    const elevation = THREE.MathUtils.degToRad(Number(refs.elevation.value));

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
  const handleSliderInput = () => {
    updateMesh();
  };

  const attach = () => {
    refs.azimuth?.addEventListener("input", handleSliderInput);
    refs.elevation?.addEventListener("input", handleSliderInput);
    refs.zoomIn?.addEventListener("click", zoomIn);
    refs.zoomOut?.addEventListener("click", zoomOut);
    updateMesh();
  };

  const detach = () => {
    refs.azimuth?.removeEventListener("input", handleSliderInput);
    refs.elevation?.removeEventListener("input", handleSliderInput);

    refs.zoomIn?.removeEventListener("click", zoomIn);
    refs.zoomOut?.removeEventListener("click", zoomOut);
  };

  return { refs, attach, detach };
};
