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
  selected: THREE.Mesh | null;
};

export type HoverController = {
  attach: () => void;
  detach: () => void;
  dispose: () => void;
};
