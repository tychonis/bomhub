import { createBrowserRouter, RouteObject } from "react-router-dom";
import { Components } from "./components";
import App from "App";
import { Playground } from "dev/playground/playground";
import { TreePage } from "pages/tree/tree";
import { Workspace } from "pages/workspace/workspace";
import { MeshPage } from "pages/mesh/mesh";

const routes: RouteObject[] = [
  {
    path: "/workspace/:digest",
    element: <Workspace />,
  },
  { path: "/tree/:id/:digest", element: <TreePage /> },
  { path: "/mesh/:id/:digest", element: <MeshPage /> },
  { path: "/forbidden", element: <div>403 Forbidden</div> },

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
