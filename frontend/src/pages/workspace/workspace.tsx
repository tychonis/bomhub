import styles from "./workspace.module.css";

import bomhub from "api/ky";
import { WorkspaceSummary } from "components/workspace-summary/workspace-summary";
import { TreeRootSelector } from "components/tree-root-selector/tree-root-selector";
import { API_ROOT } from "api/constants";
import { useEffect, useState } from "react";

async function getWorkspaceDetails(digest: string): Promise<any> {
  console.log(API_ROOT);
  const detail = await bomhub.get(`${API_ROOT}/workspace/${digest}`).json();

  return detail;
}

async function getBomTreeRoots(digest: string): Promise<any> {
  console.log(API_ROOT);
  const roots = await bomhub
    .get(`${API_ROOT}/workspace/${digest}/roots`)
    .json();

  return roots;
}

const Title = ({ label }: { label: string }) => (
  <div className={styles["title"]}>
    <h2> {label} </h2>
  </div>
);

export const Workspace = () => {
  const workspaceName = "chess";

  const [roots, setRoots] = useState<string[]>([]);
  const [details, setDetails] = useState();

  useEffect(() => {
    getBomTreeRoots("").then((data) => {
      setRoots(data["roots"]);
    });
  }, []);

  useEffect(() => {
    getWorkspaceDetails("").then((data) => {
      console.log(data);
      setDetails(data);
    });
  }, []);

  return (
    <div className={styles["ws-container"]}>
      <Title label={workspaceName}></Title>
      <WorkspaceSummary details={details}></WorkspaceSummary>
      <TreeRootSelector roots={roots}></TreeRootSelector>
    </div>
  );
};
