import { Outlet, NavLink } from 'react-router-dom'
import '@/components/Layout.css'

export function Layout() {
  return (
    <div className="layout">
      <header className="layout-header">
        <NavLink to="/" className="layout-brand" end>
          Sistem Peminjaman Ruangan Kampus
        </NavLink>
        <nav className="layout-nav">
          <NavLink
            to="/rooms"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Ruangan
          </NavLink>
          <NavLink
            to="/bookings"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Peminjaman
          </NavLink>
        </nav>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}
