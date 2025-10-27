import styles from "./tree-root-selector.module.css";

export function TreeRootSelector({ roots }: { roots: string[] }) {
  const labels = roots.concat("+");
  return (
    <div className={styles["panel"]}>
      {labels.map((label) => (
        <div className={styles["label"]} key={label}>
          {label}
        </div>
      ))}
    </div>
  );
}
