// import { TestPage } from "pages/test-page/test-page";
import { ExperimentOutlined, HomeOutlined } from "@ant-design/icons";
import { Landing } from "pages/landing/landing";
import { Bom } from "pages/bom/bom";

interface Component {
  path: string;
  key: string;
  label: string;
  icon: JSX.Element;
  element: JSX.Element;
}

export const Components: Component[] = [
  {
    path: "/",
    key: "home",
    label: "Home",
    icon: <HomeOutlined />,
    element: <Landing />,
  },
  {
    path: "/chess/bom",
    key: "chess",
    label: "Chess",
    icon: <ExperimentOutlined />,
    element: <Bom index={0} />,
  },
  {
    path: "/factorio/bom",
    key: "factorio",
    label: "Factorio",
    icon: <ExperimentOutlined />,
    element: <Bom index={1} />,
  },
  {
    path: "/pnp/bom",
    key: "pnp",
    label: "PnP",
    icon: <ExperimentOutlined />,
    element: <Bom index={2} />,
  },
];

export const keyToIndex = new Map<string, number>();
Components.forEach((value: Component, index: number) => {
  keyToIndex.set(value.key, index);
});
