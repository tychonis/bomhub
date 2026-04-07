import styles from "./mesh.module.css";

import { useEffect, useState } from "react";
import bomhub from "api/ky";
// import { ContextPanel } from "components/context-panel/context-panel";
import { API_ROOT } from "api/constants";
import { TreeIndex } from "components/tree-index/tree-index";
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

export const MeshPage = () => {
  // const { id, digest } = useParams<{ id: string; digest: string }>();
  const id = "2";
  const digest =
    "bab1d24770399ea5703ce9545d9105490d678c3c66a1d646a863617b485147a1";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bom, setBom] = useState<BpcDocument | null>(null);

  useEffect(() => {
    setBom(null);
    setSelectedId(null);
    getRawBPC(id, digest)
      .then((bpc) => {
        setBom(bpc);
        setSelectedId(bpc.root);
      })
      .catch(console.error);
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
      <MeshView selectedID={selectedId} setSelectedID={setSelectedId} />
    </div>
  );
};
