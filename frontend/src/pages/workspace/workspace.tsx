import { WorkspaceSummary } from "components/workspace-summary/workspace-summary";
import styles from "./workspace.module.css";
import { TreeRootSelector } from "components/tree-root-selector/tree-root-selector";

export const Workspace = () => {
  const workspaceName = "chess";

  return (
    <div className={styles["ws-container"]}>
      <div className={styles["title"]}>
        <h2> {workspaceName} </h2>
      </div>
      <WorkspaceSummary uniqueParts={1}></WorkspaceSummary>
      <TreeRootSelector></TreeRootSelector>
    </div>
  );
};
