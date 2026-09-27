import { Link } from 'react-router-dom'
import { CreditCard, Mail, MapPin, Smartphone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-brand">Campus Customs</p>
          <p>Yale gear made for the people who make New Haven home — even if only for a couple of years.</p>
        </div>
        <div>
          <p className="footer-heading">Shop</p>
          <ul>
            <li><Link to="/products">All Products</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/signup">Create Account</Link></li>
          </ul>
        </div>
        <div>
          <p className="footer-heading">Visit</p>
          <ul>
            <li><MapPin size={16} aria-hidden="true" /> New Haven, CT</li>
            <li><Mail size={16} aria-hidden="true" /> hello@campuscustoms.yale.edu</li>
          </ul>
        </div>
      </div>
      <div className="container payments">
        <span className="payments-label">We accept</span>
        <span className="pay-badge"><Smartphone size={14} aria-hidden="true" /> Zelle</span>
        <span className="pay-badge"><CreditCard size={14} aria-hidden="true" /> Mastercard</span>
        <span className="pay-badge"><CreditCard size={14} aria-hidden="true" /> Visa</span>
      </div>
      <p className="container footer-legal">
        © {new Date().getFullYear()} Campus Customs · A student project for MGT 409. Not an official Yale University store.
      </p>
    </footer>
  )
}
