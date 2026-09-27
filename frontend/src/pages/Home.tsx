import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap, Heart, MessageCircle, Truck } from 'lucide-react'
import { fetchProducts, type Product } from '../api'
import ProductCard from '../components/ProductCard'
import HeroCarousel from '../components/HeroCarousel'

const testimonials = [
  {
    image: '/testimonials/student.jpg',
    quote: 'The day I first pulled on my Campus Customs hoodie, campus finally felt like home.',
    name: 'Marcus Ellis',
    role: 'Yale Student',
  },
  {
    image: '/testimonials/parent.jpg',
    quote: 'Wearing my Yale tee, I feel part of my daughter’s journey — even from three states away.',
    name: 'Elena Ramirez',
    role: 'Yale Parent',
  },
  {
    image: '/testimonials/teacher.jpg',
    quote: 'My Campus Customs quarter-zip reminds me every morning that I belong to this community.',
    name: 'Dr. Grace Lin',
    role: 'Yale Faculty',
  },
]

const perks = [
  { icon: GraduationCap, title: 'Made for Yalies', text: 'Gear for first days, final exams, and everything in between.' },
  { icon: Heart, title: 'Loved by Families', text: 'Parents: the easiest way to rep your Bulldog from anywhere.' },
  { icon: Truck, title: 'Campus Pickup', text: 'Order online and pick it up on campus, no shipping wait.' },
  { icon: MessageCircle, title: 'Ask Handsome Dan', text: 'Our bulldog assistant knows every size, color, and price.' },
]

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([])

  useEffect(() => {
    fetchProducts()
      .then((all) => setFeatured(all.filter((_, i) => i % 13 === 0).slice(0, 4)))
      .catch(() => setFeatured([]))
  }, [])

  return (
    <>
      <section className="hero">
        <HeroCarousel />
        <div className="container hero-inner">
          <p className="eyebrow">New Haven · Since my very first semester</p>
          <h1>Wear the Blue. Find Your Place.</h1>
          <p className="hero-tag">
            Yale gear that makes every student, parent, and fan feel right at home — the moment they put it on.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-light">
              Shop the Collection <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/about" className="btn btn-outline-light">Our Story</Link>
          </div>
        </div>
      </section>

      <section className="container section">
        <ul className="perks">
          {perks.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Icon size={32} aria-hidden="true" />
              <h2>{title}</h2>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>Fresh on the Shelves</h2>
          <Link to="/products" className="link-arrow">
            View All <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="product-grid">
          {featured.map((p) => <ProductCard key={p.product_id} product={p} />)}
        </div>
      </section>

      <section className="band">
        <div className="container">
          <div className="section-head" style={{ justifyContent: 'center' }}>
            <h2>Where Bulldogs Belong</h2>
          </div>
          <ul className="testimonials">
            {testimonials.map((t) => (
              <li key={t.name} className="testimonial">
                <img src={t.image} alt={t.name} loading="lazy" />
                <blockquote>“{t.quote}”</blockquote>
                <p className="testimonial-name">{t.name}</p>
                <p className="testimonial-role">{t.role}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
