import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="container section">
      <h1>Page not found</h1>
      <p className="muted">Even Handsome Dan couldn't sniff this one out.</p>
      <Link to="/" className="btn btn-primary">Back Home</Link>
    </section>
  )
}
