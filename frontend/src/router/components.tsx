// import { TestPage } from "pages/test-page/test-page";
import { HomeOutlined } from "@ant-design/icons";
import { Landing } from "pages/landing/landing";

export interface Component {
  path: string;
  key: string;
  label: string;
  icon: JSX.Element;
  element: JSX.Element;
  children: Component[];
}

export const Components: Component[] = [
  {
    path: "/",
    key: "home",
    label: "Home",
    icon: <HomeOutlined />,
    element: <Landing />,
    children: [],
  },
];
