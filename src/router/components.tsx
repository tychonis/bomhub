import { TestPage } from "pages/TestPage/TestPage";
import { CarOutlined, HomeOutlined, ThunderboltOutlined, ToolOutlined } from "@ant-design/icons";
import { Landing } from "pages/Landing/Landing";

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
        element: <Landing />
    },
    {
        path: "/parts",
        key: "parts",
        label: "Parts",
        icon: <ToolOutlined />,
        element: <TestPage />
    },
    {
        path: "/thing",
        key: "thing",
        label: "Thing",
        icon: <CarOutlined />,
        element: <TestPage />
    },
    {
        path: "/test_page",
        key: "test_page",
        label: "Test Page",
        icon: <ThunderboltOutlined />,
        element: <TestPage />
    }
];

export const keyToIndex = new Map<string, number>();
Components.forEach((value:Component, index:number) => {keyToIndex.set(value.key, index)});
