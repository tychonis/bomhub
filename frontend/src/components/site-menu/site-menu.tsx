import styles from "./site-menu.module.css";

import { Menu, MenuProps } from "antd";
import { useNavigate } from "react-router-dom";
import { Components, keyToIndex } from "router/components";

export const SiteMenu = () => {
  const navigate = useNavigate();

  const onClick: MenuProps["onClick"] = (e) => {
    const index = keyToIndex.get(e.key);
    if (typeof index === "number") {
      const component = Components[index];
      navigate(component.path);
    }
  };

  return (
    <div>
      <Menu
        className={styles["site-menu"]}
        onClick={onClick}
        items={[
          {
            type: "divider",
          },
          ...Components,
        ]}
      />
    </div>
  );
};
