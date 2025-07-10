import { useEffect, useState } from "react";
import ky from 'ky';
import { ItemMeta, ItemNode, FormationTree } from "components/formation-tree/formation-tree";
import { ItemDetailsPanel } from "components/items-details-panel/item-details-panel";
import { ContextPanel } from "components/context-panel/context-panel";

async function loadBpc() {
  const data = await ky.get('/api/chess.bpc').json();
  return data;
}

interface BpcDocument {
  root: string;                                     // root node ID
  nodes: Record<string, ItemNode>;                  // ItemNode ID → node
  items: Record<string, ItemMeta>;                  // Item ID → metadata
  usage: Record<string, string[]>;                  // Item ID → [ItemNode ID]
  version?: number;                                 // optional versioning
}

export const TestPage = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bom, setBom] = useState<BpcDocument | null> (null);

  function parseBpc(data: any) {
    const bom: BpcDocument = data as BpcDocument
    setBom(bom)
  }

  useEffect(() => {
    loadBpc().then(parseBpc).catch(console.error);
  }, []);

  if (!bom) {
    return <></>
  }

  console.log(bom)
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
            branch: "main",
            commit: "abc123def456",
            sourcePath: "bom/chess_set.bpo"
        }}
      />
    </div>
  );
};
