import styles from "./workspace-summary.module.css";

interface WorkspaceSummaryProps {
  details: Record<string, string>;
}

export function WorkspaceSummary({ details }: WorkspaceSummaryProps) {
  return (
    <div className={styles["panel"]}>
      Unique Parts: {details["unique parts"]}
    </div>
  );
}
