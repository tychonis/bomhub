import styles from "./item-details.module.css";
import { useEffect, useState } from "react";
import { API_ROOT } from "api/constants";
import bomhub from "api/ky";

async function GetItemDetails(itemID: string): Promise<any> {
  return bomhub.get(`${API_ROOT}/item/${itemID}`).json();
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
      <td className={styles["value"]}>{value}</td>
    </tr>
  );
}

function GenerateAttrList(node, item) {
  const rows: [string, React.ReactNode][] = [
    ["Part #:", item.part_number || "—"],
    ["Item ID:", node.item],
    ["Node ID:", node.id],
  ];

  if (node.qty !== undefined) {
    rows.push(["Quantity:", node.qty]);
  }

  if (node.variant) {
    rows.push(["Variant:", node.variant]);
  }

  return rows;
}

export function ItemDetails({ node, item, reuseCount }) {
  const [attrs, setAttrs] = useState<[string, React.ReactNode][]>([]);
  if (!node || !item) {
    return (
      <div className={styles["empty"]}>Select a part to view details.</div>
    );
  }

  useEffect(() => {
    const extra: [string, React.ReactNode][] = [];

    if (reuseCount > 1) {
      extra.push(["Used In:", <>{reuseCount} places</>]);
    }

    setAttrs(GenerateAttrList(node, item).concat(extra));

    GetItemDetails(node.item).then((result) => {
      const finalExtra = extra.concat([
        ["Details:", <>{result["image"]}</>], // replace with actual content
      ]);
      setAttrs(GenerateAttrList(node, item).concat(finalExtra));
    });
  }, [node, item, reuseCount]);

  return (
    <div className={styles["panel"]}>
      <h2 className={styles["title"]}>{item.qualifier}</h2>
      <div className={styles["panel-content"]}>
        <table className={styles["item-attrs"]}>
          <tbody>
            {attrs.map(([label, value], i) => (
              <DetailRow key={i} label={label} value={value} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
