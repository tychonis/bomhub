import styles from "./workspace-summary.module.css";

interface WorkspaceSummaryProps {
  uniqueParts: number;
}

export function WorkspaceSummary({ uniqueParts }: WorkspaceSummaryProps) {
  return <div className={styles["panel"]}>Unique Parts: {uniqueParts}</div>;
}
