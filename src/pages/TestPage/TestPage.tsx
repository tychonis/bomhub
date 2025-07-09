import { useState } from "react";
import { ItemMeta, ItemNode, FormationTree } from "components/formation-tree/formation-tree";
import { ItemDetailsPanel } from "components/items-details-panel/item-details-panel";
import { ContextPanel } from "components/context-panel/context-panel";

const mockItems: Record<string, ItemMeta> = {
  "item-1": { id: "item-1", name: "chess_set" },
  "item-2": { id: "item-2", name: "white_suit" },
  "item-3": { id: "item-3", name: "black_suit" },
  "item-4": { id: "item-4", name: "pawn" },
};

const mockNodes: Record<string, ItemNode> = {
  "node-1": { id: "node-1", item_id: "item-1", children: ["node-2", "node-3"], parent_id: null },
  "node-2": { id: "node-2", item_id: "item-2", children: ["node-4"], parent_id: "node-1" },
  "node-3": { id: "node-3", item_id: "item-3", children: ["node-5"], parent_id: "node-1" },
  "node-4": { id: "node-4", item_id: "item-4", children: [], parent_id: "node-2", qty: 8 },
  "node-5": { id: "node-5", item_id: "item-4", children: [], parent_id: "node-3", qty: 8 },
};

const mockReuseIndex: Record<string, string[]> = {
  "item-4": ["node-4", "node-5"],
};

export const TestPage = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div style={{ height: "80vh", width: "80vw", display: "flex"}}>
      <FormationTree
        nodes={mockNodes}
        items={mockItems}
        rootId="node-1"
        reuseIndex={mockReuseIndex}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <ItemDetailsPanel
        node={mockNodes["node-1"]}
        item={mockItems["item-1"]}
        reuseCount={1}
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
