import styles from "./mesh.module.css";

import { useEffect, useState } from "react";
import bomhub from "api/ky";
// import { ContextPanel } from "components/context-panel/context-panel";
import { API_ROOT } from "api/constants";
import { TreeIndex } from "components/tree-index/tree-index";
import * as THREE from "three";
import * as MESH from "dev/threejs/mesh";
import { MeshView } from "dev/threejs/meshview";

interface BpcDocument {
  root: string; // root node ID
  nodes: any; // ItemNode ID → node
  items: any; // Item ID → metadata
  usage: any; // Item ID → [ItemNode ID]
}

async function getRawBPC(id: string, digest: string): Promise<BpcDocument> {
  const [tree, catalog] = await Promise.all([
    bomhub.get(`${API_ROOT}/tree/${id}/${digest}`).json(),
    bomhub.get(`${API_ROOT}/catalog/${id}`).json(),
  ]);

  const doc: BpcDocument = {
    root: tree.root,
    nodes: tree.nodes,
    items: catalog.items,
    usage: tree.reuse,
  };

  return doc;
}

async function getModels(): Promise<MESH.ModelDef[]> {
  const shift = new THREE.Vector3(-0.2, 0, 0);
  const mesh: MESH.ModelDef[] = [
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

  return mesh;
}

export const MeshPage = () => {
  // const { id, digest } = useParams<{ id: string; digest: string }>();
  const id = "2";
  const digest =
    "bab1d24770399ea5703ce9545d9105490d678c3c66a1d646a863617b485147a1";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bom, setBom] = useState<BpcDocument | null>(null);
  const [models, setModels] = useState<MESH.ModelDef[] | null>(null);

  useEffect(() => {
    setBom(null);
    setSelectedId(null);
    getRawBPC(id, digest)
      .then((bpc) => {
        setBom(bpc);
        setSelectedId(bpc.root);
      })
      .catch(console.error);
    getModels().then((models) => {
      setModels(models);
    });
  }, [digest]);

  if (!bom) {
    return <></>;
  }

  return (
    <div className={styles["mesh-container"]}>
      <TreeIndex
        nodes={bom.nodes}
        items={bom.items}
        rootId={bom.root}
        reuseIndex={bom.usage}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <MeshView models={models} />
    </div>
  );
};
