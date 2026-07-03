import { QuaternionIndicator } from "components/quaternion-indicator/quaternion-indicator";

export const Playground = () => {
  return (
    <div style={{ width: "8rem", height: "8rem" }}>
      <QuaternionIndicator quaternion={{ x: 0, y: 0, z: 0, w: 1 }} />
    </div>
  );
};
