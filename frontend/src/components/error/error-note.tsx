import { Link } from "react-router-dom";
import styles from "./error-note.module.css";

export function ErrorNote() {
  return (
    <div className={styles.container}>
      <h2>Something went wrong</h2>
      <p>We couldn't load this page.</p>
      <Link to="/" className={styles.button}>
        Go home
      </Link>{" "}
    </div>
  );
}
