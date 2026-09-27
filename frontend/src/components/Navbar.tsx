import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Home, Info, LogIn, LogOut, Menu, Shirt, Truck, X } from 'lucide-react'
import { useAuth } from '../AuthContext'

const links = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/products', label: 'Products', icon: Shirt },
  { to: '/about', label: 'About Us', icon: Info },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="site-header">
      <div className="announcement">
        <Truck size={15} aria-hidden="true" /> Free campus pickup for all Yale students &amp; families
      </div>
      <nav className="nav container" aria-label="Main">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-mark" aria-hidden="true">Y</span>
          <span className="brand-text">
            Campus Customs
            <small>Yale apparel for students &amp; parents</small>
          </span>
        </Link>

        <button
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="nav-links"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        <ul id="nav-links" className={`nav-links ${open ? 'open' : ''}`}>
          {links.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} onClick={close}>
                <Icon size={18} aria-hidden="true" /> {label}
              </NavLink>
            </li>
          ))}
          {user ? (
            <>
              <li className="nav-greeting">Hi, {user.first_name || user.email}</li>
              <li>
                <button
                  className="btn btn-primary nav-cta"
                  onClick={() => {
                    logout()
                    close()
                    navigate('/')
                  }}
                >
                  <LogOut size={18} aria-hidden="true" /> Log Out
                </button>
              </li>
            </>
          ) : (
            <li>
              <NavLink to="/login" className="nav-cta" onClick={close}>
                <LogIn size={18} aria-hidden="true" /> Log In / Sign Up
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </header>
  )
}
