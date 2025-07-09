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
    <div style={{ padding: 16, width: "20%", borderLeft: "1px solid #eee", fontSize: 14 }}>
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Variant:</label>
        <select
          value={variant}
          onChange={(e) => setVariant(e.target.value)}
          style={{ width: "100%", padding: 4 }}
        >
          <option value="">All</option>
          <option value="white">white</option>
          <option value="black">black</option>
        </select>
      </div>

      {gitInfo && (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Git Info:</div>
          <div><strong>Branch:</strong> {gitInfo.branch || "—"}</div>
          <div><strong>Commit:</strong> {gitInfo.commit?.slice(0, 8) || "—"}</div>
          <div style={{ marginTop: 4 }}>
            <strong>Source:</strong>
            <div style={{ fontSize: 12, color: "#555" }}>{gitInfo.sourcePath || "—"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
