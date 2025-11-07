import styles from "./tree-root-selector.module.css";

import { Link } from "react-router-dom";

export function TreeRootSelector({ id, roots }) {
  return (
    <div className={styles["panel"]}>
      {roots.map((root) => {
        const link = "/tree/" + id + "/" + root.digest;
        return (
          <Link to={link} className={styles["link"]} key={root.digest}>
            <div className={styles["label"]}>{root.name}</div>
          </Link>
        );
      })}
    </div>
  );
}
