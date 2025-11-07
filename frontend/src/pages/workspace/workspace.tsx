import styles from "./workspace.module.css";

import bomhub from "api/ky";
import { WorkspaceSummary } from "components/workspace-summary/workspace-summary";
import { TreeRootSelector } from "components/tree-root-selector/tree-root-selector";
import { API_ROOT } from "api/constants";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

async function getWorkspaceDetails(id: string): Promise<any> {
  const detail = await bomhub.get(`${API_ROOT}/workspace/${id}`).json();

  return detail;
}

async function getBomTreeRoots(id: string): Promise<any> {
  const roots = await bomhub.get(`${API_ROOT}/workspace/${id}/roots`).json();

  return roots;
}

const Title = ({ label }: { label: string }) => (
  <div className={styles["title"]}>
    <h2> {label} </h2>
  </div>
);

export const Workspace = () => {
  const { digest } = useParams<{ digest: string }>();

  const [wsName, setWsName] = useState<string>();
  const [roots, setRoots] = useState<string[]>([]);
  const [details, setDetails] = useState();

  useEffect(() => {
    if (!digest) return;

    getBomTreeRoots(digest).then((data) => {
      setRoots(data["roots"]);
    });
  }, [digest]);

  useEffect(() => {
    if (!digest) return;

    getWorkspaceDetails(digest).then((data) => {
      setWsName(data["name"]);
      setDetails(data);
    });
  }, [digest]);

  return (
    <div className={styles["ws-container"]}>
      <Title label={wsName}></Title>
      <WorkspaceSummary details={details}></WorkspaceSummary>
      <TreeRootSelector id={digest} roots={roots}></TreeRootSelector>
    </div>
  );
};
