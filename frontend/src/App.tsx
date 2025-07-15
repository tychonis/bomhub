import 'App.css'
import { SiteHeader } from 'components/SiteHeader/SiteHeader'
import { SiteMenu } from 'components/SiteMenu/SiteMenu'
import { Outlet } from 'react-router-dom'

function App() {
  return (
    <>
      <SiteHeader />
      <SiteMenu />
      <Outlet />
    </>
  )
}

export default App
