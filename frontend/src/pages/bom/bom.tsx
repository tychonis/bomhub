import { useEffect, useState } from "react";
import ky from 'ky';
import { ItemMeta, ItemNode, FormationTree } from "components/formation-tree/formation-tree";
import { ItemDetailsPanel } from "components/items-details-panel/item-details-panel";
import { ContextPanel } from "components/context-panel/context-panel";

interface BpcRef {
  name: string;
  repo: string;
  bpc: string;
};

interface BpcDocument {
  root: string;                                     // root node ID
  nodes: Record<string, ItemNode>;                  // ItemNode ID → node
  items: Record<string, ItemMeta>;                  // Item ID → metadata
  usage: Record<string, string[]>;                  // Item ID → [ItemNode ID]
  version?: number;                                 // optional versioning
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
  const refs: BpcRef[] = await ky.get("https://api.bomhub.tychonis.com/boms").json();

  const bpcs: Bpc[] = [];

  for (const ref of refs) {
    const match = ref.repo.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(\/)?$/);
    if (!match) continue;

    const [_, owner, repo] = match;

    const data:any = await ky.get("https://api.github.com/repos/tychonis/cyanotype-chess/branches").json();
    const branchName = data[0].name;
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${branchName}/${ref.bpc}`;
    const document = await ky.get(rawUrl).json();
    const bpc:Bpc = {
      document: document as BpcDocument,
      gitInfo: {
        branch:data[0].name,
        commit:data[0].commit.sha,
        path:ref.bpc,
      }
    }
    bpcs.push(bpc);
  }

  return bpcs;
}


export const Bom = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bpcs, setBpcs] = useState<Bpc[] | null> (null);

  useEffect(() => {
    getRawBPCs().then(setBpcs).catch(console.error);
  }, []);

  if (!bpcs) {
    return <></>
  }

  const bom = bpcs[0].document;

  if (!selectedId) {
    setSelectedId(bom.root)
    return <></>
  }

  return (
    <div style={{ height: "80vh", width: "80vw", display: "flex"}}>
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
            branch: bpcs[0].gitInfo.branch,
            commit: bpcs[0].gitInfo.commit,
            sourcePath: bpcs[0].gitInfo.path
        }}
      />
    </div>
  );
};
