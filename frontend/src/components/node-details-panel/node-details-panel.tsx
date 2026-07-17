import styles from "./node-details-panel.module.css";
import { useEffect, useState } from "react";
import { API_ROOT } from "api/constants";
import bomhub from "api/ky";

async function GetSymbolDetails(symbolID: string): Promise<any> {
  return bomhub.get(`${API_ROOT}/definition/${symbolID}`).json();
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

function GenerateAttrList(node) {
  const rows: [string, React.ReactNode][] = [
    ["Item ID:", node.item],
    ["Node ID:", node.id],
    ["Process ID:", node.process],
  ];

  if (node.qty !== undefined) {
    rows.push(["Quantity:", node.qty]);
  }

  if (node.variant) {
    rows.push(["Variant:", node.variant]);
  }

  return rows;
}

export function NodeDetails({ node }) {
  const [title, setTitle] = useState<string>(node.item);
  const [attrs, setAttrs] = useState<[string, React.ReactNode][]>([]);

  useEffect(() => {
    const extra: [string, React.ReactNode][] = [];
    setAttrs(GenerateAttrList(node).concat(extra));

    const symbols = [
      ["Item", node.item],
      ["Process", node.process],
      ["Coitem", node.coitem],
      ["Coprocess", node.coprocess],
    ] as const;

    Promise.all(
      symbols.map(async ([label, id]) => ({
        label,
        result: id ? await GetSymbolDetails(id) : undefined,
      }))
    ).then((results) => {
      console.log("results", results);
      results.map(({ label, result }) => {
        if (label == "Item" && result?.content?.details?.label) {
          setTitle(result.content.details.label);
        }
      });
    });
  }, [node]);

  if (!node) {
    return (
      <div className={styles["empty"]}>Select a part to view details.</div>
    );
  }

  return (
    <div className={styles["panel"]}>
      <h2 className={styles["title"]}>{title}</h2>
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
