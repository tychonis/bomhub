import styles from "./node-details-panel.module.css";
import { useEffect, useState } from "react";
import { API_ROOT } from "api/constants";
import bomhub from "api/ky";
import { Artifact } from "components/artifact/artifact";

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

  return rows;
}

const capitalize = (s: string) => s[0]?.toUpperCase() + s.slice(1);

function getArtifacts(symbol) {
  if (!symbol || !symbol.content || !symbol.content.artifacts) {
    return [];
  }

  const validArtifacts = [];
  for (const artifact of symbol.content.artifacts) {
    if (!artifact.digest || !artifact.path) {
      continue;
    }
    validArtifacts.push([
      capitalize(artifact.tag),
      <Artifact
        digest={artifact.digest}
        filename={artifact.path.split("/").pop() ?? artifact.path}
      />,
    ]);
  }
  return validArtifacts;
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
      results.map(({ label, result }) => {
        if (label == "Item" && result?.content?.details?.label) {
          setTitle(result.content.details.label);
        }
        const artifacts = getArtifacts(result);
        if (artifacts.length > 0) {
          setAttrs((prev) => prev.concat(artifacts));
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
