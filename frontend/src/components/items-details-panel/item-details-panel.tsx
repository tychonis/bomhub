import type { ItemNode, ItemMeta } from "../formation-tree/formation-tree";
import styles from "./item-details-panel.module.css"

interface ItemDetailsPanelProps {
  node: ItemNode | null;
  item: ItemMeta | null;
  reuseCount: number;
  onJumpToInstance?: (id: string) => void;
}

export function ItemDetailsPanel({ node, item, reuseCount, onJumpToInstance }: ItemDetailsPanelProps) {
  if (!node || !item) {
    return <div className={styles["empty"]}>Select a part to view details.</div>;
  }

  return (
    <div className={styles["panel"]}>
      <h2 className={styles["title"]}>{item.name}</h2>
      <table>
        <tbody>
          <tr>
            <td>Part #:</td>
            <td>{item.part_number || "—"}</td>
          </tr>
          <tr>
            <td>Item ID:</td>
            <td>{item.id}</td>
          </tr>
          <tr>
            <td>Node ID:</td>
            <td>{node.id}</td>
          </tr>
          {node.qty !== undefined && (
            <tr>
              <td>Quantity:</td>
              <td>{node.qty}</td>
            </tr>
          )}
          {node.variant && (
            <tr>
              <td>Variant:</td>
              <td>{node.variant}</td>
            </tr>
          )}
          {reuseCount > 1 && (
            <tr>
              <td>Used In:</td>
              <td>
                {reuseCount} places
                {onJumpToInstance && (
                  <div style={{ marginTop: 4 }}>
                    <button
                      className={styles["jump-button"]}
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
