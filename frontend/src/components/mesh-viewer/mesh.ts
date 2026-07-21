import * as THREE from "three";
import CameraControls from "camera-controls";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

CameraControls.install({ THREE });

const DRACO_DECODER_PATH =
  "https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/libs/draco/";

export type ModelDef = {
  name: string;
  item: string;
  rotation?: THREE.Quaternion;
  shift?: THREE.Vector3;
};

export type Mesh = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: CameraControls;
  loader: GLTFLoader;
  objects: THREE.Object3D[];
  dispose: () => void;
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

export function fitCameraToObjects(
  mesh: Mesh,
  padding = 1.5,
  transition = false
) {
  if (mesh.objects.length === 0) return;

  const box = new THREE.Box3();

  for (const object of mesh.objects) {
    object.updateMatrixWorld(true);

    const objectBox = new THREE.Box3().setFromObject(object);
    if (!objectBox.isEmpty()) {
      box.union(objectBox);
    }
  }

  if (box.isEmpty()) return;

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const radius = size.length() * 0.5;
  const distance = maxDim * padding;

  const direction = new THREE.Vector3(1, 1, 1).normalize();
  const position = center.clone().add(direction.multiplyScalar(distance));

  mesh.camera.near = Math.max(radius / 1000, 0.001);
  mesh.camera.far = Math.max(radius * 1000, distance * 10, 1000);
  mesh.camera.updateProjectionMatrix();

  mesh.controls.setLookAt(
    position.x,
    position.y,
    position.z,
    center.x,
    center.y,
    center.z,
    transition
  );
}

const setLighting = (scene: THREE.Scene) => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  // 1. Key light (main, strongest)
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(5, 5, 5);
  scene.add(keyLight);

  // 2. Fill light (opposite side, softer)
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-5, 2, 5);
  scene.add(fillLight);

  // 3. Back light (rim light from behind)
  const backLight = new THREE.DirectionalLight(0xffffff, 1.0);
  backLight.position.set(0, 5, -5);
  scene.add(backLight);
};

export const createDefaultMesh = (mount: HTMLElement): Mesh => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const width = mount.clientWidth || 1;
  const height = mount.clientHeight || 1;

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.001, 1000);
  camera.position.set(3, 3, 3);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  const controls = new CameraControls(camera, renderer.domElement);

  setLighting(scene);

  const loader = new GLTFLoader();
  loader.setWithCredentials(true);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  loader.setDRACOLoader(dracoLoader);

  const objects: THREE.Object3D[] = [];

  let animationID = 0;
  let last = performance.now();

  function animate(now: number) {
    const delta = (now - last) / 1000;
    last = now;

    controls.update(delta);
    renderer.render(scene, camera);

    animationID = requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  const resizeObserver = new ResizeObserver(() => {
    const width = mount.clientWidth || 1;
    const height = mount.clientHeight || 1;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  });

  resizeObserver.observe(mount);

  return {
    scene,
    camera,
    renderer,
    controls,
    loader,
    objects,

    dispose() {
      cancelAnimationFrame(animationID);
      resizeObserver.disconnect();

      controls.dispose();
      dracoLoader.dispose();

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

      renderer.dispose();
      renderer.domElement.remove();
    },
  };
};

export const loadModel = (
  mesh: Mesh,
  id: string,
  url: string,
  rotation: THREE.Quaternion = new THREE.Quaternion(0, 0, 0, 1),
  position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
  preserveCamera: boolean = false
) => {
  mesh.loader.load(
    url,
    (gltf) => {
      const object = gltf.scene;
      object.userData.id = id;

      object.quaternion.copy(rotation);
      object.position.copy(position);

      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map((m) => m.clone());
          } else {
            child.material = child.material.clone();
          }
        }
      });

      mesh.scene.add(object);
      mesh.objects.push(object);
      if (!preserveCamera) {
        fitCameraToObjects(mesh);
      }
    },
    undefined,
    (error) => {
      console.error("Error loading model:", error);
    }
  );
};

export function clearModels(mesh: Mesh) {
  for (const object of mesh.objects.values()) {
    object.removeFromParent();

    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      child.geometry.dispose();

      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      for (const material of materials) {
        material.dispose();
      }
    });
  }

  mesh.objects = [];
}

export const dispose = (m: Mesh) => {
  m.dispose();
};

export type HoverController = {
  attach: () => void;
  detach: () => void;
};

export const createMouseController = (
  mesh: Mesh,
  setSelectedDigest: React.Dispatch<React.SetStateAction<string>>,
  setHovered: React.Dispatch<React.SetStateAction<string>>
): HoverController => {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let hovered: THREE.Mesh | null = null;
  let downTime = 0;
  let downX = 0;
  let downY = 0;

  const updateHover = (nextHovered: THREE.Mesh | null) => {
    if (hovered === nextHovered) return;

    if (hovered) {
      setHighlight(hovered, false);
      setHovered("");
    }
    hovered = nextHovered;
    if (hovered) {
      setHighlight(hovered, true);
      const hoveredID = findObjectId(hovered);
      if (hoveredID) setHovered(hoveredID);
    }
  };

  const pointerEventObject = (event: PointerEvent): THREE.Mesh | null => {
    const rect = mesh.renderer.domElement.getBoundingClientRect();

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, mesh.camera);

    const hits = raycaster.intersectObjects(mesh.objects, true);
    const obj = hits[0]?.object;

    return obj instanceof THREE.Mesh ? obj : null;
  };

  const handlePointerMove = (event: PointerEvent) => {
    updateHover(pointerEventObject(event));
  };

  const handlePointerDown = (event: PointerEvent) => {
    downTime = event.timeStamp;
    downX = event.clientX;
    downY = event.clientY;
  };

  const handlePointerUp = (event: PointerEvent) => {
    const duration = event.timeStamp - downTime;
    const dx = event.clientX - downX;
    const dy = event.clientY - downY;
    const distance = Math.abs(dx) + Math.abs(dy);

    if (duration > 200 || distance > 10) return;

    const clicked = pointerEventObject(event);
    const clickedID = findObjectId(clicked);

    if (clickedID) setSelectedDigest(clickedID);
  };

  const handlePointerLeave = () => {
    updateHover(null);
  };

  const el = mesh.renderer.domElement;

  return {
    attach() {
      el.addEventListener("pointermove", handlePointerMove);
      el.addEventListener("pointerleave", handlePointerLeave);
      el.addEventListener("pointerdown", handlePointerDown);
      el.addEventListener("pointerup", handlePointerUp);
    },

    detach() {
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerleave", handlePointerLeave);
      el.removeEventListener("pointerdown", handlePointerDown);
      el.removeEventListener("pointerup", handlePointerUp);
    },
  };
};
