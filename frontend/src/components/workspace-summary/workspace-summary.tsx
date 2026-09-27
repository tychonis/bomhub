import { useEffect, useState } from "react";
import styles from "./workspace-summary.module.css";
import bomhub from "api/ky";
import { API_ROOT } from "api/constants";

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

async function getWorkspaceDetails(id: string): Promise<any> {
  const detail = await bomhub.get(`${API_ROOT}/workspace/${id}`).json();

  return detail;
}

const Stat = ({
  value,
  label,
  mono = false,
}: {
  value: React.ReactNode;
  label: string;
  mono?: boolean;
}) => (
  <div className={styles["stat"]}>
    <span className={`${styles["stat-value"]} ${mono ? styles["mono"] : ""}`}>
      {value}
    </span>
    <span className={styles["stat-label"]}>{label}</span>
  </div>
);

export const WorkspaceSummary = ({ workspaceId }: { workspaceId: string }) => {
  const [details, setDetails] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    getWorkspaceDetails(workspaceId).then((data) => {
      setDetails(data);
    });
  }, [workspaceId]);

  if (details) {
    return (
      <section className={styles["summary"]}>
        <div className={styles["identity"]}>
          <h1 className={styles["title"]}>{details.name}</h1>

          <div className={styles["metadata"]}>
            {details.repo && <span>{details.repo}</span>}
            {details.updated_at && (
              <span>Updated {formatDate(details.updated_at)}</span>
            )}
          </div>
        </div>

        <div className={styles["stats"]}>
          <Stat value={details.part_count || 0} label="Parts" />
          <Stat value={details.unique_parts || 0} label="Unique" />
          <Stat value={details.root_count || 0} label="Roots" />{" "}
          <Stat
            value={details.latest_revision?.slice(0, 7) || ""}
            label="Revision"
            mono
          />
        </div>
      </section>
    );
  }
  return null;
};
