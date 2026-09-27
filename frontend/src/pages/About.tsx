import { useState } from 'react'
import { Globe, Handshake, ShieldCheck, Store } from 'lucide-react'

const values = [
  { icon: Globe, title: 'Everyone Belongs', text: 'Whether you grew up next to campus or half a world away, this is your team too.' },
  { icon: ShieldCheck, title: 'Always Honest', text: 'Real prices and real stock numbers, straight from our inventory.' },
  { icon: Handshake, title: 'Community First', text: 'A New Haven store for Yale students, families, and fans — for years.' },
]

export default function About() {
  // Store image slot — add `frontend/public/about/store.jpg` (a student and a
  // parent happily buying a Yale shirt from a Campus Customs employee). Until it
  // exists, a styled placeholder frame shows instead.
  const [hasStoreImg, setHasStoreImg] = useState(true)

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">About Us</p>
          <h1>Dressing the Yale Community for Years</h1>
        </div>
      </section>

      <section className="container section about-split">
        <div className="about-col">
          <div className="about-text">
            <p className="lead">
              Campus Customs has been outfitting Yale students, parents, and fans for years — a New Haven store
              built on Bulldog pride.
            </p>
            <p>
              We started with a simple idea: everyone connected to Yale should have gear they're proud to wear.
              Over the years we've dressed first-years on move-in day, grad students pulling all-nighters,
              alumni back for reunions, and parents cheering from the stands at the Yale Bowl.
            </p>
            <p>
              Our collection covers everything the season calls for — hoodies and crewnecks for chilly New Haven
              mornings, tees for The Game, quarter-zips for interviews, and jackets to carry you through winter.
              Every piece is chosen with the Yale community in mind.
            </p>
            <p>
              And because shopping should be easy, Handsome Dan, our bulldog assistant, is waiting in the corner
              of every page to help you find the right size, color, and price in seconds.
            </p>
          </div>

          <ul className="values">
            {values.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon size={28} aria-hidden="true" />
                <div>
                  <h2>{title}</h2>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <figure className="store-photo">
          {hasStoreImg ? (
            <img
              src="/about/store.jpg"
              alt="A student and a parent buying a Yale shirt from a Campus Customs employee"
              onError={() => setHasStoreImg(false)}
            />
          ) : (
            <div className="store-photo-placeholder">
              <Store size={40} aria-hidden="true" />
              <p>Store photo coming soon</p>
            </div>
          )}
          <figcaption>Inside Campus Customs — helping the Yale community find their perfect fit.</figcaption>
        </figure>
      </section>
    </>
  )
}
