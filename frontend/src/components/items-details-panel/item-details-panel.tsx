import type { ItemNode, ItemMeta } from "../formation-tree/formation-tree";
import styles from "./item-details-panel.module.css";

interface ItemDetailsPanelProps {
  node: ItemNode | null;
  item: ItemMeta | null;
  reuseCount: number;
  onJumpToInstance?: (id: string) => void;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <tr>
      <td className={styles["key"]}>{label}</td>
      <td>{value}</td>
    </tr>
  );
}

function GenerateAttrList(
  node: ItemNode,
  item: ItemMeta,
  extra: [string, React.ReactNode][]
) {
  const rows: [string, React.ReactNode][] = [
    ["Part #:", item.part_number || "—"],
    ["Item ID:", item.id],
    ["Node ID:", node.id],
  ];

  if (node.qty !== undefined) {
    rows.push(["Quantity:", node.qty]);
  }

  if (node.variant) {
    rows.push(["Variant:", node.variant]);
  }

  return rows.concat(extra);
}

export function ItemDetailsPanel({
  node,
  item,
  reuseCount,
}: ItemDetailsPanelProps) {
  if (!node || !item) {
    return (
      <div className={styles["empty"]}>Select a part to view details.</div>
    );
  }

  let extra: [string, React.ReactNode][] = [];
  if (reuseCount > 1) {
    extra = extra.concat([["Used In:", <>{reuseCount} places</>]]);
  }

  const attrs = GenerateAttrList(node, item, extra);

  return (
    <div className={styles["panel"]}>
      <h2 className={styles["title"]}>{item.name}</h2>
      <table>
        <tbody>
          {attrs.map(([label, value], i) => (
            <DetailRow key={i} label={label} value={value} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
