import { useEffect, useState } from "react";

import bomhub from "api/ky";
import { API_ROOT } from "api/constants";
import styles from "./workspace-activity.module.css";

interface Revision {
  digest: string;
  created_at: string;
}

interface RevisionsResponse {
  revisions: Revision[];
}

async function getRevisions(id: string): Promise<RevisionsResponse> {
  return bomhub.get(`${API_ROOT}/workspace/${id}/revisions`).json();
}

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

export function WorkspaceActivity({ workspaceId }: { workspaceId: string }) {
  const [revisions, setRevisions] = useState<Revision[]>([]);

  useEffect(() => {
    getRevisions(workspaceId).then((data) => {
      setRevisions(data.revisions);
    });
  }, [workspaceId]);

  return (
    <section className={styles["activity"]}>
      <h2 className={styles["heading"]}>Recent activity</h2>

      <div className={styles["timeline"]}>
        {revisions.map((revision) => (
          <div className={styles["entry"]} key={revision.digest}>
            <div className={styles["marker"]} />

            <div className={styles["content"]}>
              <div className={styles["description"]}>Workspace updated</div>

              <div className={styles["metadata"]}>
                <span className={styles["digest"]}>
                  {revision.digest.slice(0, 7)}
                </span>
                <span>{formatDate(revision.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
