import styles from "./node-variant-tab.module.css";
import { useEffect, useState } from "react";
import { API_ROOT } from "api/constants";
import bomhub from "api/ky";
import { useParams } from "react-router-dom";

async function GetCoItemVariant(catalog: string, coItem: string): Promise<any> {
  return bomhub.get(`${API_ROOT}/variant/${catalog}/${coItem}`).json();
}

function VariantRow({ dataRow }) {
  const date = new Date(dataRow.revision.created_at / 1000000);
  return (
    <tr>
      <td className={styles["key"]}>{dataRow.revision.id.slice(0, 6)}</td>
      <td className={styles["value"]}>{date.toLocaleString()}</td>
    </tr>
  );
}

export function NodeVariant({ node }) {
  const { id } = useParams<{ id: string }>();
  const [variant, setVariant] = useState<any[]>([]);

  useEffect(() => {
    GetCoItemVariant(id, node.coitem).then((variant) => {
      setVariant(variant);
    });
  }, [id, node]);

  if (!variant || variant.length === 0) {
    return <div className={styles["empty"]}>There is no variant to view.</div>;
  }

  return (
    <div className={styles["tab"]}>
      <table>
        <tbody>
          {variant?.map((dataRow) => (
            <VariantRow key={dataRow.revision.id} dataRow={dataRow} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
