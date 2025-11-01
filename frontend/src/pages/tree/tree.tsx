import styles from "./tree.module.css";

import { useEffect, useState } from "react";
import bomhub from "api/ky";
import {
  ItemMeta,
  ItemNode,
  FormationTree,
} from "components/formation-tree/formation-tree";
import { ItemDetailsPanel } from "components/items-details-panel/item-details-panel";
import { ContextPanel } from "components/context-panel/context-panel";
import { API_ROOT } from "api/constants";
import { useParams } from "react-router-dom";

interface BpcDocument {
  root: string; // root node ID
  nodes: Record<string, ItemNode>; // ItemNode ID → node
  items: Record<string, ItemMeta>; // Item ID → metadata
  usage: Record<string, string[]>; // Item ID → [ItemNode ID]
  version?: number; // optional versioning
}

interface GitInfo {
  branch: string;
  commit: string;
  path: string;
}

interface Bpc {
  document: BpcDocument;
  gitInfo: GitInfo;
}

async function getRawBPC(digest: string): Promise<Bpc> {
  const [tree, catalog] = await Promise.all([
    bomhub.get(`${API_ROOT}/tree/${digest}`).json(),
    bomhub.get(`${API_ROOT}/catalog/${digest}`).json(),
  ]);

  const document: BpcDocument = {
    root: digest,
    nodes: tree.nodes,
    items: catalog.items,
    usage: tree.usage,
  };

  const bpc: Bpc = {
    document: document,
    gitInfo: null,
  };
  return bpc;
}

export const TreePage = () => {
  const { digest } = useParams<{ digest: string }>();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bpc, setBpc] = useState<Bpc | null>(null);

  useEffect(() => {
    setBpc(null);
    setSelectedId(null);
    getRawBPC(digest).then(setBpc).catch(console.error);
  }, [digest]);

  if (!bpc) {
    return <></>;
  }

  const bom = bpc.document;
  const git = bpc.gitInfo;

  if (!selectedId) {
    setSelectedId(bom.root);
    return <></>;
  }

  return (
    <div className={styles["tree-container"]}>
      <FormationTree
        nodes={bom.nodes}
        items={bom.items}
        rootId={bom.root}
        reuseIndex={bom.usage}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <ItemDetailsPanel
        node={bom.nodes[selectedId!]}
        item={bom.items[bom.nodes[selectedId!].item_id]}
        reuseCount={bom.usage[bom.nodes[selectedId!].item_id].length}
      />
      <ContextPanel
        variant=""
        setVariant={() => {}}
        gitInfo={{
          branch: git.branch,
          commit: git.commit,
          sourcePath: git.path,
        }}
      />
    </div>
  );
};
