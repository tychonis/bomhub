import { createBrowserRouter, RouteObject } from "react-router-dom";
import { Components } from "./components";
import App from "App";
import { Playground } from "dev/playground/playground";
import { TreePage } from "pages/tree/tree";
import { Workspace } from "pages/workspace/workspace";

const routes: RouteObject[] = [
  {
    path: "/workspace/:digest",
    element: <Workspace />,
  },
  { path: "/tree/:id/:digest", element: <TreePage /> },

  { path: "/__dev/playground", element: <Playground /> },
];

const root = [
  {
    path: "/",
    element: <App />,
    children: routes.concat(Components),
  },
];

export const router = createBrowserRouter(root);
