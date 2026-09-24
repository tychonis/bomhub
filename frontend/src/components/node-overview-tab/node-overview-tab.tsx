import styles from "./node-overview-tab.module.css";
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
    ["Node ID:", digestValue(node.id)],
    ["Item ID:", digestValue(node.item)],
    ["Process ID:", digestValue(node.process)],
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
    if (!artifact.digest || !artifact.filename) {
      continue;
    }
    validArtifacts.push([
      capitalize(artifact.tag),
      <Artifact digest={artifact.digest} filename={artifact.filename} />,
    ]);
  }
  return validArtifacts;
}

function digestValue(digest: string) {
  if (!digest) {
    return "—";
  }
  return <div title={digest}>{digest.slice(0, 8)}</div>;
}

export function NodeOverview({ node }) {
  const [extras, setExtras] = useState<[string, React.ReactNode][]>([]);

  useEffect(() => {
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
      setExtras(results.flatMap(({ result }) => getArtifacts(result)));
    });
  }, [node]);

  if (!node) {
    return (
      <div className={styles["empty"]}>Select a part to view details.</div>
    );
  }

  const attrs = GenerateAttrList(node).concat(extras);

  return (
    <div className={styles["tab"]}>
      <table className={styles["item-attrs"]}>
        <tbody>
          {attrs.map(([label, value], i) => (
            <DetailRow key={i} label={label} value={value} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
