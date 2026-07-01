import { createBrowserRouter, RouteObject } from "react-router-dom";
import { Components } from "./components";
import { Playground } from "dev/playground/playground";
import { TreePage } from "pages/tree/tree";
import { Workspace } from "pages/workspace/workspace";
import { MeshPage } from "pages/mesh/mesh";
import { MainLayout, SimpleLayout } from "layout/layout";

const routes: RouteObject[] = [
  {
    path: "/workspace/:digest",
    element: <Workspace />,
  },
  { path: "/tree/:id/:digest", element: <TreePage /> },
  { path: "/forbidden", element: <div>403 Forbidden</div> },

  { path: "/__dev/playground", element: <Playground /> },
];

const root = [
  {
    path: "/",
    element: <MainLayout />,
    children: routes.concat(Components),
  },
  {
    element: <SimpleLayout />,
    children: [
      {
        path: "/mesh/:id/:digest",
        element: <MeshPage />,
      },
    ],
  },
];

export const router = createBrowserRouter(root);
