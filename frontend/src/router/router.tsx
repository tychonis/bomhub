import { createBrowserRouter, RouteObject } from "react-router-dom";
import { Components } from "./components";
import App from "App";
import { Playground } from "dev/playground/playground";
import { TreePage } from "pages/tree/tree";

const playGroundRoute: RouteObject = {
  path: "/__dev/playground",
  element: <Playground />,
};

const treeRoute: RouteObject = {
  path: "/tree/:digest",
  element: <TreePage />,
};

const root = [
  {
    path: "/",
    element: <App />,
    children: (Components as RouteObject[])
      .concat(playGroundRoute)
      .concat(treeRoute),
  },
];

export const router = createBrowserRouter(root);
