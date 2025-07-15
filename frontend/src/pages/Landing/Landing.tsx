import "./Landing.css"
import tychonisLogo from "assets/logo.png"

export const Landing = () => (
    <>
      <div>
        <a href="https://tychonis.com" target="_blank">
          <img src={tychonisLogo} className="logo" alt="Tychonis logo" />
        </a>
      </div>
      <h1>Bom Hub</h1>
      <div className="card">
        <p>
          Hello Tychonis!
        </p>
      </div>
    </>
  )