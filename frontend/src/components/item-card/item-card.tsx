import { Link } from "react-router-dom";
import ApartmentOutlined from "@ant-design/icons/ApartmentOutlined";

import styles from "./item-card.module.css";

interface ItemCardProps {
  name: string;
  to: string;
  partCount?: number;
  uniqueParts?: number;
  thumbnail?: string;
}

export function ItemCard({
  name,
  to,
  partCount,
  uniqueParts,
  thumbnail,
}: ItemCardProps) {
  return (
    <Link to={to} className={styles["card"]}>
      <div className={styles["preview"]}>
        {thumbnail ? (
          <img className={styles["thumbnail"]} src={thumbnail} alt="" />
        ) : (
          <ApartmentOutlined />
        )}
      </div>

      <div className={styles["content"]}>
        <div className={styles["name"]}>{name}</div>

        {(partCount !== undefined || uniqueParts !== undefined) && (
          <div className={styles["metadata"]}>
            {partCount !== undefined && <span>{partCount} parts</span>}
            {uniqueParts !== undefined && <span>{uniqueParts} unique</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
