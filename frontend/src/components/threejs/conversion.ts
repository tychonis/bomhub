import * as THREE from "three";

export function CADToThreePosition(v) {
  return new THREE.Vector3(v.x, v.z, -v.y);
}

export function ThreeToCADPosition(v) {
  return new THREE.Vector3(v.x, -v.z, v.y);
}

const CAD_TO_THREE_BASIS = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  -Math.PI / 2
);

export function CADToThreeRotation(q: THREE.Quaternion): THREE.Quaternion {
  return CAD_TO_THREE_BASIS.clone()
    .multiply(q)
    .multiply(CAD_TO_THREE_BASIS.clone().invert())
    .normalize();
}

export function ThreeToCADRotation(q: THREE.Quaternion): THREE.Quaternion {
  return CAD_TO_THREE_BASIS.clone()
    .invert()
    .multiply(q)
    .multiply(CAD_TO_THREE_BASIS)
    .normalize();
}
