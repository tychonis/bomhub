import "App.css";
import { SiteHeader } from "components/site-header/site-header";
import { SiteMenu } from "components/site-menu/site-menu";
import { Outlet } from "react-router-dom";

function App() {
  return (
    <>
      <SiteHeader />
      <div style={{ display: "flex" }}>
        <SiteMenu />
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
      </div>
    </>
  );
}

export default App;
