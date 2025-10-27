import styles from "./workspace.module.css";

import { WorkspaceSummary } from "components/workspace-summary/workspace-summary";
import { TreeRootSelector } from "components/tree-root-selector/tree-root-selector";

const Title = ({ label }: { label: string }) => (
  <div className={styles["title"]}>
    <h2> {label} </h2>
  </div>
);

export const Workspace = () => {
  const workspaceName = "chess";
  const details: Record<string, string> = { "unique parts": "1" };
  const roots = ["test1", "test2", "test3"];

  return (
    <div className={styles["ws-container"]}>
      <Title label={workspaceName}></Title>
      <WorkspaceSummary details={details}></WorkspaceSummary>
      <TreeRootSelector roots={roots}></TreeRootSelector>
    </div>
  );
};
