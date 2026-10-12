import styles from "./site-header.module.css";

import DebouncedSearch from "components/search/search";
import tychonisLogo from "assets/logo.png";
import { Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";

export const SiteHeader = () => {
  return (
    <div className={styles["site-header"]}>
      <img
        src={tychonisLogo}
        className={styles["header-logo"]}
        alt="Tychonis logo"
        onClick={() => (window.location.href = "/")}
      />
      <DebouncedSearch
        placeholder="Search part number etc"
        className={styles["header-search"]}
      />
      <div className={styles["header-avatar"]}>
        <Avatar icon={<UserOutlined />} />
      </div>
    </div>
  );
};
