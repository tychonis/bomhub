import bomhub from "api/ky";
import { API_ROOT } from "api/constants";
import styles from "./tree-root-selector.module.css";

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ItemCard } from "components/item-card/item-card";
import PlusOutlined from "@ant-design/icons/PlusOutlined";

interface TreeRoot {
  name: string;
  digest: string;
  part_count?: number;
  unique_parts?: number;
}

interface TreeRootsResponse {
  roots: TreeRoot[];
}

async function getBomTreeRoots(id: string): Promise<TreeRootsResponse> {
  return bomhub.get(`${API_ROOT}/workspace/${id}/roots`).json();
}

export function TreeRootSelector({ workspaceId }: { workspaceId: string }) {
  const [roots, setRoots] = useState<TreeRoot[]>([]);

  useEffect(() => {
    getBomTreeRoots(workspaceId).then((data) => {
      setRoots(data.roots);
    });
  }, [workspaceId]);

  return (
    <section className={styles["roots"]}>
      <h2 className={styles["heading"]}>Assemblies</h2>

      <div className={styles["grid"]}>
        {roots.map((root) => (
          <ItemCard
            key={root.digest}
            name={root.name}
            to={`/mesh/${workspaceId}/${root.digest}`}
            partCount={root.part_count}
            uniqueParts={root.unique_parts}
          />
        ))}

        <Link
          to={`/${workspaceId}/new_root`}
          className={`${styles["card"]} ${styles["add-card"]}`}
        >
          <PlusOutlined />
          <span>Add assembly</span>
        </Link>
      </div>
    </section>
  );
}
