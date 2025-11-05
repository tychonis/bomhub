import styles from "./site-menu.module.css";

import { Menu, MenuProps } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Component, Components } from "router/components";
import { API_ROOT } from "api/constants";
import bomhub from "api/ky";
import { ExperimentOutlined } from "@ant-design/icons";

async function getBoms() {
  const boms = await bomhub.get(`${API_ROOT}/boms`).json();
  return boms;
}

export const SiteMenu = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState(Components);

  const onClick: MenuProps["onClick"] = (e) => {
    navigate(e.key);
  };

  useEffect(() => {
    getBoms().then((boms) => {
      const dynComponents: Component[] = boms.map((bom) => ({
        path: "/workspace/" + bom.id,
        key: "/workspace/" + bom.id,
        label: bom.name,
        icon: <ExperimentOutlined />,
      }));
      const allItems = Components.concat(dynComponents);
      setItems(allItems);
    });
  }, []);

  return (
    <div className={styles["site-menu-container"]}>
      <Menu
        className={styles["site-menu"]}
        onClick={onClick}
        items={[
          {
            type: "divider",
          },
          ...items,
        ]}
      />
    </div>
  );
};
