import styles from "./attachment.module.css";

export function Attachment({ attachments }) {
  return (
    <div className={styles["panel"]}>
      <div className={styles["title"]}>Attachments:</div>
      {attachments.map((attachment) => (
        <div className={styles["section"]}>
          <div>
            <strong>Type: </strong>
            {attachment.type}
          </div>
          <div>
            <strong>Name: </strong>
            {attachment.name}
          </div>
        </div>
      ))}
    </div>
  );
}
