import styles from "./node-history-tab.module.css";
import { useEffect, useState } from "react";
import { API_ROOT } from "api/constants";
import bomhub from "api/ky";
import { useParams } from "react-router-dom";

async function GetCoItemHistory(catalog: string, coItem: string): Promise<any> {
  return bomhub.get(`${API_ROOT}/history/${catalog}/${coItem}`).json();
}

function HistoryRow({ dataRow }) {
  const date = new Date(dataRow.revision.created_at / 1000000);
  return (
    <tr>
      <td className={styles["key"]}>{dataRow.revision.id.slice(0, 6)}</td>
      <td className={styles["value"]}>{date.toLocaleString()}</td>
    </tr>
  );
}

export function NodeHistory({ node }) {
  const { id } = useParams<{ id: string }>();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    GetCoItemHistory(id, node.coitem).then((history) => {
      setHistory(history);
    });
  }, [id, node]);

  if (!history || history.length === 0) {
    return <div className={styles["empty"]}>There is no history to view.</div>;
  }

  return (
    <div className={styles["tab"]}>
      <table>
        <tbody>
          {history?.map((dataRow) => (
            <HistoryRow key={dataRow.revision.id} dataRow={dataRow} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
