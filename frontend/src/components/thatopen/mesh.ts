import * as THREE from "three";
import * as conv from "./conversion";
import * as OBC from "@thatopen/components";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

export type ModelDef = {
  name: string;
  item: string;
  path: string;
  rotation?: THREE.Quaternion;
  shift?: THREE.Vector3;
};

export type Mesh = {
  world: OBC.World;
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

export function fitCameraToObjects(
  world: any,
  objects: THREE.Object3D[],
  padding = 1.5,
  transition = false
) {
  if (objects.length === 0) return;

  const box = new THREE.Box3();

  for (const object of objects) {
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

  const camera = world.camera.three;

  camera.near = Math.max(radius / 1000, 0.001);
  camera.far = Math.max(radius * 1000, distance * 10, 1000);

  camera.position.copy(position);
  camera.lookAt(center);
  camera.updateProjectionMatrix();

  world.camera.controls.setLookAt(
    position.x,
    position.y,
    position.z,
    center.x,
    center.y,
    center.z,
    transition
  );
}

export const createDefaultMesh = (mount: HTMLElement): Mesh => {
  const components = new OBC.Components();

  const worlds = components.get(OBC.Worlds);
  const world = worlds.create<
    OBC.SimpleScene,
    OBC.SimpleCamera,
    OBC.SimpleRenderer
  >();

  world.scene = new OBC.SimpleScene(components);
  world.renderer = new OBC.SimpleRenderer(components, mount);
  world.camera = new OBC.SimpleCamera(components);
  world.renderer.showLogo = false;

  components.init();

  world.scene.setup();
  world.scene.three.background = new THREE.Color(0xffffff);
  world.camera.controls.setLookAt(3, 3, 3, 0, 0, 0);

  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://cdn.jsdelivr.net/npm/three@0.164.0/examples/jsm/libs/draco/"
  );
  loader.setDRACOLoader(dracoLoader);

  const objects: THREE.Object3D[] = [];

  return { world, loader, objects };
};

export const loadModel = (
  mesh: Mesh,
  id: string,
  url: string,
  rotation: THREE.Quaternion = new THREE.Quaternion(0, 0, 0, 1),
  position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
) => {
  mesh.loader.load(
    url,
    async (gltf) => {
      const object = gltf.scene;
      object.userData.id = id;

      mesh.world.scene.three.add(object);

      object.quaternion.multiply(conv.CADToThreeRotation(rotation));
      object.position.add(conv.CADToThreePosition(position));

      mesh.objects.push(object);
      await fitCameraToObjects(mesh.world, mesh.objects);
    },
    undefined,
    (error) => {
      console.error("Error loading model:", error);
    }
  );
};

export const dispose = (m: Mesh) => {
  m.world.scene.three.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      const mesh = object as THREE.Mesh;
      mesh.geometry.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) {
        material.forEach((m) => m.dispose());
      } else {
        material.dispose();
      }
    }
  });
};

export type InteractionState = {
  hovered: THREE.Mesh | null;
  // selected: THREE.Mesh | null;
};

export type HoverController = {
  attach: () => void;
  detach: () => void;
};

export const createHoverController = (
  mesh: Mesh,
  setSelectedID: React.Dispatch<React.SetStateAction<string>>
) => {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let hovered: THREE.Mesh | null = null;
  // let selected: THREE.Mesh | null = null;

  const updateHover = (nextHovered: THREE.Mesh | null) => {
    if (hovered === nextHovered) return;

    if (hovered) setHighlight(hovered, false);
    hovered = nextHovered;
    if (hovered) setHighlight(hovered, true);
  };

  const pointerEventObject = (event: PointerEvent) => {
    const rect = mesh.world.renderer.three.domElement.getBoundingClientRect();

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, mesh.world.camera.three);
    const hits = raycaster.intersectObjects(mesh.objects, true);
    return hits.length > 0 ? (hits[0].object as THREE.Mesh) : null;
  };

  const handlePointerMove = (event: PointerEvent) => {
    const nextHovered = pointerEventObject(event);
    updateHover(nextHovered);
  };

  let clickStartTime = 0;

  const handlePointerDown = (event: PointerEvent) => {
    clickStartTime = event.timeStamp;
  };

  const handlePointerUp = (event: PointerEvent) => {
    const clickDuration = event.timeStamp - clickStartTime;
    if (clickDuration < 200) {
      handleClick(event);
    }
  };

  const handleClick = (event: PointerEvent) => {
    const clicked = pointerEventObject(event);
    const clickedID = findObjectId(clicked);
    console.log("clicked", clickedID);
    if (clickedID) setSelectedID(clickedID);
  };

  const handlePointerLeave = () => {
    updateHover(null);
  };

  const el = mesh.world.renderer.three.domElement;

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
