import styles from "./mesh.module.css";

import { useEffect, useState } from "react";
import bomhub from "api/ky";
import { API_ROOT } from "api/constants";
import { TreeIndex } from "components/tree-index/tree-index";
import { MeshView } from "components/thatopen/meshview";
import { useParams } from "react-router-dom";

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
    items: catalog.symbols,
    usage: tree.reuse,
  };

  return doc;
}

export const MeshPage = () => {
  const { id, digest } = useParams<{ id: string; digest: string }>();

  const [selectedDigest, setSelectedDigest] = useState<string | null>(null);
  const [bom, setBom] = useState<BpcDocument | null>(null);

  useEffect(() => {
    setBom(null);
    setSelectedDigest(null);
    getRawBPC(id, digest)
      .then((bpc) => {
        setBom(bpc);
        setSelectedDigest(bpc.root);
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
        rootDigest={bom.root}
        reuseIndex={bom.usage}
        selectedDigest={selectedDigest}
        onSelect={setSelectedDigest}
      />
      <MeshView
        nodes={bom.nodes}
        selectedDigest={selectedDigest}
        setSelectedDigest={setSelectedDigest}
      />
    </div>
  );
};
