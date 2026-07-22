import styles from "./tree.module.css";

import { useEffect, useState } from "react";
import bomhub from "api/ky";
import { ItemDetailsPanel } from "components/items-details-panel/item-details-panel";
// import { ContextPanel } from "components/context-panel/context-panel";
import { API_ROOT } from "api/constants";
import { useParams } from "react-router-dom";
import { TreeIndex } from "components/tree-index/tree-index";
import { Attachment } from "components/attachement/attachment";

interface BpcDocument {
  root: string; // root node ID
  nodes: any; // ItemNode ID → node
  items: any; // Item ID → metadata
  usage: any; // Item ID → [ItemNode ID]
}

async function getRawBPC(id: string, digest: string): Promise<BpcDocument> {
  const [tree, catalog] = await Promise.all([
    bomhub.get(`${API_ROOT}/tree/${id}/${digest}`).json(),
    bomhub.get(`${API_ROOT}/workspace/${id}/catalog`).json(),
  ]);

  const doc: BpcDocument = {
    root: tree.root,
    nodes: tree.nodes,
    items: catalog.symbols,
    usage: tree.reuse,
  };

  return doc;
}

async function getAttachments(id: string) {
  return bomhub.get(`${API_ROOT}/attachements/${id}`).json();
}

export const TreePage = () => {
  const { id, digest } = useParams<{ id: string; digest: string }>();

  const [selectedDigest, setSelectedDigest] = useState<string | null>(null);
  const [bom, setBom] = useState<BpcDocument | null>(null);
  const [attachements, setAttachements] = useState([]);

  useEffect(() => {
    setBom(null);
    setSelectedDigest(null);
    getRawBPC(id, digest)
      .then((bpc) => {
        setBom(bpc);
        setSelectedDigest(bpc.root);
      })
      .catch(console.error);
  }, [id, digest]);

  useEffect(() => {
    getAttachments(selectedDigest).then((attc) => {
      setAttachements(attc);
    });
  }, [selectedDigest]);

  if (!bom) {
    return <></>;
  }

  return (
    <div className={styles["tree-container"]}>
      <TreeIndex
        nodes={bom.nodes}
        items={bom.items}
        rootDigest={bom.root}
        reuseIndex={bom.usage}
        selectedDigest={selectedDigest}
        onSelect={setSelectedDigest}
      />
      <ItemDetailsPanel
        node={bom.nodes[selectedDigest!]}
        item={bom.items[bom.nodes[selectedDigest!].item]}
        reuseCount={bom.usage[bom.nodes[selectedDigest!].item].length}
      />
      <Attachment attachments={attachements} />
    </div>
  );
};
