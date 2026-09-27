import styles from "./workspace.module.css";

import { WorkspaceSummary } from "components/workspace-summary/workspace-summary";
import { useParams } from "react-router-dom";
import { TreeRootSelector } from "components/tree-root-selector/tree-root-selector";
import { WorkspaceActivity } from "components/workspace-activity/workspace-activity";

export const Workspace = () => {
  const { digest } = useParams<{ digest: string }>();

  return (
    <div className={styles["ws-container"]}>
      <div className={styles["ws-summary"]}>
        <WorkspaceSummary workspaceId={digest} />
      </div>
      <main className={styles["ws-main"]}>
        <TreeRootSelector workspaceId={digest} />
      </main>
      <aside className={styles["ws-aside"]}>
        <WorkspaceActivity workspaceId={digest} />
      </aside>
    </div>
  );
};
