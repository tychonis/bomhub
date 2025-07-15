import styles from "./context-panel.module.css"

interface ContextPanelProps {
  variant: string;
  setVariant: (v: string) => void;
  gitInfo?: {
    commit?: string;
    branch?: string;
    sourcePath?: string;
  };
}

export function ContextPanel({ variant, setVariant, gitInfo }: ContextPanelProps) {
  return (
    <div className={styles["panel"]}>
      <div className={styles["section"]}>
        <label>Variant:</label>
        <select
          value={variant}
          onChange={(e) => setVariant(e.target.value)}
        >
          <option value="">All</option>
          <option value="white">white</option>
          <option value="black">black</option>
        </select>
      </div>

      {gitInfo && (
        <div>
          <div className={styles["title"]}>Git Info:</div>
          <div><strong>Branch:</strong> {gitInfo.branch || "—"}</div>
          <div><strong>Commit:</strong> {gitInfo.commit?.slice(0, 8) || "—"}</div>
          <div className={styles["git-source"]}>
            <strong>Source:</strong>
            <div>{gitInfo.sourcePath || "—"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
