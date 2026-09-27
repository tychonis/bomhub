import { useEffect, useState } from "react";

import bomhub from "api/ky";
import { API_ROOT } from "api/constants";
import styles from "./workspace-activity.module.css";

interface Revision {
  id: string;
  created_at: number;
}

async function getRevisions(id: string): Promise<Revision[]> {
  return bomhub.get(`${API_ROOT}/workspace/${id}/revisions`).json();
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp / 1000000).toLocaleString();
}

export function WorkspaceActivity({ workspaceId }: { workspaceId: string }) {
  const [revisions, setRevisions] = useState<Revision[]>([]);

  useEffect(() => {
    getRevisions(workspaceId).then((revisions) => {
      setRevisions(revisions);
    });
  }, [workspaceId]);

  console.log(revisions);
  return (
    <section className={styles["activity"]}>
      <h2 className={styles["heading"]}>Recent activity</h2>

      <div className={styles["timeline"]}>
        {revisions.map((revision) => (
          <div className={styles["entry"]} key={revision.id}>
            <div className={styles["marker"]} />

            <div className={styles["content"]}>
              <div className={styles["description"]}>Workspace updated</div>

              <div className={styles["metadata"]}>
                <span className={styles["digest"]}>
                  {revision.id.slice(0, 7)}
                </span>
                <span>{formatTimestamp(revision.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
