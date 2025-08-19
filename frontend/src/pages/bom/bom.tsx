import styles from "./bom.module.css";

import { useEffect, useState } from "react";
import ky from "api/ky";
import {
  ItemMeta,
  ItemNode,
  FormationTree,
} from "components/formation-tree/formation-tree";
import { ItemDetailsPanel } from "components/items-details-panel/item-details-panel";
import { ContextPanel } from "components/context-panel/context-panel";

interface BpcRef {
  name: string;
  repo: string;
  bpc: string;
}

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

async function getRawBPCs(): Promise<Bpc[]> {
  const refs: BpcRef[] = await ky
    .get("https://api.bomhub.tychonis.com/boms")
    .json();

  const bpcs: Bpc[] = [];

  for (const ref of refs) {
    const match = ref.repo.match(
      /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(\/)?$/
    );
    if (!match) continue;

    const [_, owner, repo] = match;

    const data: any = await ky
      .get(`https://api.github.com/repos/${owner}/${repo}/branches`)
      .json();
    const branchName = data[0].name;
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${branchName}/${ref.bpc}`;
    const document = await ky.get(rawUrl).json();
    const bpc: Bpc = {
      document: document as BpcDocument,
      gitInfo: {
        branch: data[0].name,
        commit: data[0].commit.sha,
        path: ref.bpc,
      },
    };
    bpcs.push(bpc);
  }

  return bpcs;
}

async function getRawBPC(index: number): Promise<Bpc> {
  const bpcs = await getRawBPCs();
  return bpcs[index];
}

export const Bom = ({ index }: { index: number }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bpc, setBpc] = useState<Bpc | null>(null);

  useEffect(() => {
    setBpc(null);
    setSelectedId(null);
    getRawBPC(index).then(setBpc).catch(console.error);
  }, [index]);

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
    <div className={styles["bom-container"]}>
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
