import styles from "./thatopen.module.css";

import bomhub from "api/ky";
import { API_ROOT } from "api/constants";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import * as MESH from "./mesh";
import { useParams } from "react-router-dom";

async function getModels(id: string, digest: string): Promise<MESH.ModelDef[]> {
  const rawModelDef = await bomhub
    .get(`${API_ROOT}/models/${id}/${digest}`)
    .json();
  const ret: MESH.ModelDef[] = [];

  for (const def of rawModelDef) {
    ret.push({
      id: def.id,
      path: def.path,
      rotation: new THREE.Quaternion().fromArray(def.rotation),
      shift: new THREE.Vector3().fromArray(def.placement),
    });
  }
  return ret;
}

export function MeshView(props: {
  nodes: any;
  selectedDigest: string;
  setSelectedDigest: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { id } = useParams<{ id: string }>();

  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const mesh = MESH.createDefaultMesh(mount);

    const node = props.nodes[props.selectedDigest];

    // TODO: fix this hack.
    const findNodeByItem = (parent, item) => {
      for (const child of parent.children) {
        const childNode = props.nodes[child];
        if (childNode.item == item) {
          return child;
        }
      }
    };

    getModels(id, node.item)
      .then((models) => {
        console.log(`Loading ${models.length} models for digest ${node.item}`);
        for (const m of models) {
          const nodeID = findNodeByItem(node, m.id);
          console.log(`Loading model: ${m.path}`);
          MESH.loadModel(mesh, nodeID, m.path, m.rotation, m.shift);
        }
      })
      .catch((error) => {
        console.error("Failed to load models:", error);
      });

    const hoverControl = MESH.createHoverController(
      mesh,
      props.setSelectedDigest
    );

    return;

    hoverControl.attach();

    const handleResize = () => {
      mesh.world.renderer.resize({
        width: mount.clientWidth,
        height: mount.clientHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    return () => {
      hoverControl.detach();
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();

      if (mesh.world.renderer.three.domElement.parentNode === mount) {
        mount.removeChild(mesh.world.renderer.three.domElement);
      }
      MESH.dispose(mesh);
    };
  }, [props.nodes, props.selectedDigest, props.setSelectedDigest]);

  return <div ref={mountRef} className={styles["viewer"]}></div>;
}
