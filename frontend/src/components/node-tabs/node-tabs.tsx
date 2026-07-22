import styles from "./node-tabs.module.css";

import { Tabs } from "antd";
import type { TabsProps } from "antd";
import { NodeOverview } from "components/node-overview-tab/node-overview-tab";

export function NodeTabs({ node }) {
  const tabItems: TabsProps["items"] = [
    {
      key: "overview",
      label: "Overview",
      children: <NodeOverview node={node} />,
    },
    {
      key: "variant",
      label: "Variant",
      children: <div></div>,
    },
    {
      key: "history",
      label: "History",
      children: <div></div>,
    },
    {
      key: "actions",
      label: "Actions",
      children: <div></div>,
    },
  ];
  return (
    <div className={styles["node-tabs"]}>
      <h2 className={styles["title"]}>{node?.name}</h2>
      <Tabs defaultActiveKey="overview" items={tabItems} />
    </div>
  );
}
