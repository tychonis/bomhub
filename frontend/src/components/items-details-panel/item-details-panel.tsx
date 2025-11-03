import ky from "api/ky";
import styles from "./item-details-panel.module.css";
import { useEffect, useState } from "react";
import { API_ROOT } from "api/constants";

const DEFAULT_IMAGE =
  "https://media.printables.com/media/prints/32741/stls/320849_1e9f2158-27da-4374-a4b2-586850f4d47a/thumbs/cover/180x180/png/king-body-v2_preview.webp";

async function GetItemDetails(itemID: string): Promise<any> {
  const details = await ky.get(`${API_ROOT}/item/${itemID}`).json();
  return details;
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

export function ItemDetailsPanel({ node, item, reuseCount }) {
  const [attrs, setAttrs] = useState<[string, React.ReactNode][]>([]);
  const [image, setImage] = useState<string>(DEFAULT_IMAGE);
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

    setImage(DEFAULT_IMAGE);
    setAttrs(GenerateAttrList(node, item).concat(extra));

    GetItemDetails(item.id).then((result) => {
      const finalExtra = extra.concat([
        ["Details:", <>{result["image"]}</>], // replace with actual content
      ]);
      setAttrs(GenerateAttrList(node, item).concat(finalExtra));
      setImage(result["image"]);
    });
  }, [node, item, reuseCount]);

  return (
    <div className={styles["panel"]}>
      <h2 className={styles["title"]}>{item.name}</h2>
      <div className={styles["panel-content"]}>
        <img src={image} className={styles["item-image"]} />
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
