import { createBrowserRouter } from "react-router-dom";
import { Components } from "./components";
import App from "App";

const root = [
  {
    path: "/",
    element: <App />,
    children: Components,
  },
];

export const router = createBrowserRouter(root);
