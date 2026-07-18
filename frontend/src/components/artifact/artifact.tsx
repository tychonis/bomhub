import styles from "./artifact.module.css";
import { FileOutlined } from "@ant-design/icons";
import mime from "mime";

export function Artifact({
  digest,
  filename,
}: {
  digest: string;
  filename: string;
}) {
  const download = async () => {
    const response = await fetch(`/api/object/${digest}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Download failed");
    }

    const buffer = await response.arrayBuffer();

    const blob = new Blob([buffer], {
      type: mime.getType(filename) || "application/octet-stream",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        void download();
      }}
      className={styles["artifact"]}
    >
      <FileOutlined />
      <span>{filename}</span>
    </a>
  );
}
