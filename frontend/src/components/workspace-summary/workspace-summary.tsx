import styles from "./workspace-summary.module.css";

// interface WorkspaceSummaryProps {
//   details: Record<string, string>;
// }

export function WorkspaceSummary({ details }) {
  if (details) {
    return (
      <div className={styles["panel"]}>
        Unique Parts: {details["unique_parts"]}
      </div>
    );
  }
}
