import styles from "./layout.module.css";
import { SiteHeader } from "components/site-header/site-header";
import { SiteMenu } from "components/site-menu/site-menu";
import { Outlet } from "react-router-dom";

export const MainLayout = () => {
  return (
    <>
      <SiteHeader />
      <div>
        <SiteMenu />
        <div className={styles["outlet-container"]}>
          <Outlet />
        </div>
      </div>
    </>
  );
};

export const SimpleLayout = () => {
  return (
    <>
      <SiteHeader />
      <div>
        <div className={styles["simple-outlet-container"]}>
          <Outlet />
        </div>
      </div>
    </>
  );
};
