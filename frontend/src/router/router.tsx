import { createBrowserRouter, RouteObject } from "react-router-dom";
import { Components } from "./components";
import App from "App";
import { Playground } from "dev/playground/playground";

const playGroundRoute: RouteObject = {
  path: "/__dev/playground",
  element: <Playground />,
};

const root = [
  {
    path: "/",
    element: <App />,
    children: (Components as RouteObject[]).concat(playGroundRoute),
  },
];

export const router = createBrowserRouter(root);
