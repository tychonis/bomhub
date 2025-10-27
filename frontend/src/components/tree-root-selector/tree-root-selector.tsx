import styles from "./tree-root-selector.module.css";

export function TreeRootSelector() {
  const roots = ["test1", "test2", "test3"];
  return (
    <div className={styles["panel"]}>
      {roots.map((label) => (
        <p key={label}>{label}</p>
      ))}
    </div>
  );
}
