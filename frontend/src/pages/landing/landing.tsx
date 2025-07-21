import styles from "./landing.module.css";

import tychonisLogo from "assets/logo.png";

export const Landing = () => (
  <>
    <div>
      <a href="https://tychonis.com" target="_blank">
        <img
          src={tychonisLogo}
          className={styles["logo"]}
          alt="Tychonis logo"
        />
      </a>
    </div>
    <h1>Bom Hub</h1>
  </>
);
