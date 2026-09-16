import styles from "./viewer.module.css";

import bomhub from "api/ky";
import { API_ROOT } from "api/constants";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as MESH from "./mesh";
import { useParams } from "react-router-dom";
import { AimOutlined } from "@ant-design/icons";
import Progress from "antd/es/progress/progress";

async function getModels(id: string, digest: string): Promise<MESH.ModelDef[]> {
  const rawModelDef = await bomhub
    .get(`${API_ROOT}/models/${id}/${digest}`)
    .json();
  const ret: MESH.ModelDef[] = [];

  for (const def of rawModelDef.objects) {
    const rotation = def.placement.rotation
      ? def.placement.rotation
      : [0, 0, 0, 1];
    const shift = def.placement.position ? def.placement.position : [0, 0, 0];
    ret.push({
      name: def.name,
      item: def.item,
      source: def.source,
      type: def.type,
      rotation: new THREE.Quaternion().fromArray(rotation),
      shift: new THREE.Vector3().fromArray(shift),
    });
  }
  return ret;
}

const getItemPath = (source) => {
  return `${API_ROOT}/scene/${source}`;
};

type modelLoadingProgress = {
  total: number;
  loaded: number;
  failed: number;
};

function ProgressIndicator({ progress }: { progress: modelLoadingProgress }) {
  const { total, loaded, failed } = progress;
  if (total === 0 || total === loaded) {
    return null;
  }
  const percent = total > 0 ? (loaded / total) * 100 : 0;
  const status =
    failed > 0 && failed + loaded === total ? "exception" : "active";

  return (
    <div className={styles["viewer-progress"]}>
      <Progress
        type="circle"
        railColor="#e6f4ff"
        percent={percent}
        status={status}
        strokeWidth={20}
        size={14}
        format={() => `${loaded}/${total} loaded`}
      />
    </div>
  );
}

export function MeshView(props: {
  nodes: any;
  selectedDigest: string;
  setSelectedDigest: React.Dispatch<React.SetStateAction<string>>;
  setHovered: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { id } = useParams<{ id: string }>();

  const mountRef = useRef<HTMLDivElement | null>(null);
  const meshRef = useRef<MESH.Mesh | null>(null);
  const selectedFromMeshRef = useRef(false);
  const [progress, setProgress] = useState<modelLoadingProgress>({
    total: 0,
    loaded: 0,
    failed: 0,
  });

  // Initialize the Three.js viewer once.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const mesh = MESH.createDefaultMesh(mount);
    meshRef.current = mesh;

    const selectFromMesh = (digest: string) => {
      selectedFromMeshRef.current = true;
      const select = props.setSelectedDigest;
      select(digest);
    };

    const mouseControl = MESH.createMouseController(
      mesh,
      selectFromMesh,
      props.setHovered
    );

    mouseControl.attach();

    return () => {
      mouseControl.detach();
      MESH.dispose(mesh);
      meshRef.current = null;
    };
  }, [props.setHovered, props.setSelectedDigest]);

  // Update models without recreating the viewer or camera.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !id) return;

    const node = props.nodes[props.selectedDigest];
    if (!node) return;

    let preserveCamera = selectedFromMeshRef.current;
    selectedFromMeshRef.current = false;

    // TODO: fix this hack.
    // right now, node is generated from the tree,
    // but getModels api returns models constructed from the parent instead of the root node.
    // therefore the nodeID won't match and we need to use the name to match the model to the node.
    const findNode = (parent: any, name: string) => {
      for (const child of parent.children) {
        const childNode = props.nodes[child];

        if (childNode.name === name) {
          return child;
        }
      }
      return undefined;
    };

    MESH.clearModels(mesh);

    getModels(id, node.item)
      .then((models) => {
        setProgress({ total: models.length, loaded: 0, failed: 0 });
        // TODO: fix this hack. leaf node should use parent coordinates.
        if (models.length === 1) {
          preserveCamera = false;
        }
        for (const model of models) {
          const nodeID = findNode(node, model.name);
          if (!nodeID) {
            console.warn(`No matching node for model ${model.name}`);
          }

          const path = getItemPath(model.source);

          MESH.loadModel(
            mesh,
            nodeID,
            path,
            model.rotation,
            model.shift,
            preserveCamera
          ).then((ok) => {
            if (ok) {
              setProgress((prev) => ({ ...prev, loaded: prev.loaded + 1 }));
            } else {
              setProgress((prev) => ({ ...prev, failed: prev.failed + 1 }));
            }
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load models:", error);
      });

    return;
  }, [id, props.nodes, props.selectedDigest]);

  const resetCamera = () => {
    const mesh = meshRef.current;
    if (mesh) {
      MESH.fitCameraToObjects(mesh);
    }
  };

  return (
    <div className={styles["viewer-container"]}>
      <div ref={mountRef} className={styles["viewer"]} />
      <ProgressIndicator progress={progress} />
      <button
        className={styles["viewer-reset"]}
        aria-label="Reset camera"
        title="Reset camera"
        onClick={resetCamera}
      >
        <AimOutlined />
      </button>
    </div>
  );
}
