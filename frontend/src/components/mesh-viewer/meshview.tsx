import styles from "./viewer.module.css";

import bomhub from "api/ky";
import { API_ROOT } from "api/constants";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import * as MESH from "./mesh";
import { useParams } from "react-router-dom";
import { AimOutlined } from "@ant-design/icons";

async function getModels(id: string, digest: string): Promise<MESH.ModelDef[]> {
  const rawModelDef = await bomhub
    .get(`${API_ROOT}/models/${id}/${digest}`)
    .json();
  const ret: MESH.ModelDef[] = [];

  for (const def of rawModelDef) {
    if (!def.rotation) {
      def.rotation = [0, 0, 0, 1];
    }
    if (!def.placement) {
      def.placement = [0, 0, 0];
    }
    ret.push({
      name: def.name,
      item: def.item,
      rotation: new THREE.Quaternion().fromArray(def.rotation),
      shift: new THREE.Vector3().fromArray(def.placement),
    });
  }
  return ret;
}

const getItemPath = (id, item) => {
  return `${API_ROOT}/model/${id}/${item}`;
};

export function MeshView(props: {
  nodes: any;
  selectedDigest: string;
  setSelectedDigest: React.Dispatch<React.SetStateAction<string>>;
  setHovered: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { id } = useParams<{ id: string }>();

  const mountRef = useRef<HTMLDivElement | null>(null);
  const resetRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const resetButton = resetRef.current;
    if (!mount || !resetButton) return;

    const mesh = MESH.createDefaultMesh(mount);

    const node = props.nodes[props.selectedDigest];

    // TODO: fix this hack.
    // right now, node is generated from the tree,
    // but getModels api returns models constructed from the parent instead of the root node.
    // therefore the nodeID won't match and we need to use the name to match the model to the node.
    const findNode = (parent, name) => {
      for (const child of parent.children) {
        const childNode = props.nodes[child];
        if (childNode.name == name) {
          return child;
        }
      }
    };

    getModels(id, node.item)
      .then((models) => {
        console.log(`Loading ${models.length} models for digest ${node.item}`);
        for (const m of models) {
          const nodeID = findNode(node, m.name);
          const path = getItemPath(id, m.item);
          console.log(`Loading model at node ${nodeID}: ${path}`);
          MESH.loadModel(mesh, nodeID, path, m.rotation, m.shift);
        }
      })
      .catch((error) => {
        console.error("Failed to load models:", error);
      });

    const hoverControl = MESH.createHoverController(
      mesh,
      props.setSelectedDigest,
      props.setHovered
    );

    hoverControl.attach();
    resetButton.addEventListener("click", () => {
      MESH.fitCameraToObjects(mesh);
    });

    return () => {
      hoverControl.detach();
      MESH.dispose(mesh);
    };
  }, [
    id,
    props.nodes,
    props.setHovered,
    props.selectedDigest,
    props.setSelectedDigest,
  ]);

  return (
    <div className={styles["viewer-container"]}>
      <div ref={mountRef} className={styles["viewer"]} />
      <button
        className={styles["viewer-reset"]}
        aria-label="Reset camera"
        title="Reset camera"
        ref={resetRef}
      >
        <AimOutlined />
      </button>
    </div>
  );
}
