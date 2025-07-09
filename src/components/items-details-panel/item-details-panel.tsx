import type { ItemNode, ItemMeta } from "../formation-tree/formation-tree";

interface ItemDetailsPanelProps {
  node: ItemNode | null;
  item: ItemMeta | null;
  reuseCount: number;
  onJumpToInstance?: (id: string) => void;
}

export function ItemDetailsPanel({ node, item, reuseCount, onJumpToInstance }: ItemDetailsPanelProps) {
  if (!node || !item) {
    return <div style={{ padding: 16, fontStyle: "italic", color: "#888" }}>Select a part to view details.</div>;
  }

  return (
    <div style={{ padding: 16, width: "50%"}}>
      <h2 style={{ fontSize: 18, marginBottom: 8 }}>{item.name}</h2>
      <table style={{ width: "100%", fontSize: 14 }}>
        <tbody>
          <tr>
            <td style={{ fontWeight: 600, width: 100 }}>Part #:</td>
            <td>{item.part_number || "—"}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600 }}>Item ID:</td>
            <td>{item.id}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600 }}>Node ID:</td>
            <td>{node.id}</td>
          </tr>
          {node.qty !== undefined && (
            <tr>
              <td style={{ fontWeight: 600 }}>Quantity:</td>
              <td>{node.qty}</td>
            </tr>
          )}
          {node.variant && (
            <tr>
              <td style={{ fontWeight: 600 }}>Variant:</td>
              <td>{node.variant}</td>
            </tr>
          )}
          {reuseCount > 1 && (
            <tr>
              <td style={{ fontWeight: 600 }}>Used In:</td>
              <td>
                {reuseCount} places
                {onJumpToInstance && (
                  <div style={{ marginTop: 4 }}>
                    <button
                      style={{ fontSize: 12, padding: "2px 6px", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }}
                      onClick={() => onJumpToInstance(node.id)}
                    >
                      Jump to this instance
                    </button>
                  </div>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
