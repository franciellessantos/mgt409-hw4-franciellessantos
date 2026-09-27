import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Minus, Palette, Plus, ShoppingBag, Tag } from 'lucide-react'
import { fetchProduct, formatPrice, type Product } from '../api'

const LOW_STOCK = 5

export default function ProductDetail() {
  const { productId = '' } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found' | 'error'>('loading')
  const [size, setSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState('')

  useEffect(() => {
    setStatus('loading')
    setSize(null)
    setQty(1)
    setAdded('')
    fetchProduct(productId)
      .then((p) => {
        setProduct(p)
        setStatus('ready')
      })
      .catch((e: Error) => setStatus(e.message === 'not-found' ? 'not-found' : 'error'))
  }, [productId])

  if (status === 'loading') return <p className="container section muted">Loading…</p>
  if (status !== 'ready' || !product) {
    return (
      <section className="container section">
        <h1>{status === 'not-found' ? 'Product not found' : 'Something went wrong'}</h1>
        <Link to="/products" className="btn btn-primary">Back to Products</Link>
      </section>
    )
  }

  const inventory = product.inventory ?? []
  const totalStock = inventory.reduce((n, s) => n + s.quantity, 0)
  const selected = inventory.find((s) => s.size === size)
  const maxQty = selected?.quantity ?? 1

  function changeQty(n: number) {
    if (Number.isNaN(n)) return
    setQty(Math.min(Math.max(1, Math.round(n)), maxQty))
    setAdded('')
  }

  return (
    <section className="container section">
      <Link to="/products" className="link-arrow back">
        <ArrowLeft size={16} aria-hidden="true" /> All Products
      </Link>

      <div className="detail">
        <div className="detail-img">
          <img src={product.image_url} alt={product.name} />
        </div>

        <div className="detail-info">
          <p className="eyebrow dark">{product.garment_type}</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatPrice(product.price)}</p>
          <p className="detail-desc">{product.description}</p>

          <div className="detail-meta">
            <p><Palette size={18} aria-hidden="true" /> <strong>Colors:</strong> {product.colors.join(', ')}</p>
          </div>

          <fieldset className="sizes">
            <legend>
              Size &amp; Availability{' '}
              <span className="muted">({totalStock > 0 ? `${totalStock} units in stock` : 'sold out'})</span>
            </legend>
            <div className="size-grid">
              {inventory.map((s) => {
                const out = s.quantity === 0
                return (
                  <button
                    key={s.size}
                    type="button"
                    className={`size-btn ${size === s.size ? 'active' : ''}`}
                    disabled={out}
                    aria-pressed={size === s.size}
                    onClick={() => {
                      setSize(s.size)
                      setQty((q) => Math.min(q, s.quantity))
                      setAdded('')
                    }}
                  >
                    <span className="size-label">{s.size}</span>
                    <span className="size-stock">
                      {out ? 'Sold out' : s.quantity <= LOW_STOCK ? `Only ${s.quantity} left` : `${s.quantity} in stock`}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="qty">
            <span className="qty-label" id="qty-label">Quantity</span>
            <div className="qty-stepper" role="group" aria-labelledby="qty-label">
              <button type="button" aria-label="Decrease quantity" disabled={!selected || qty <= 1} onClick={() => changeQty(qty - 1)}>
                <Minus size={16} />
              </button>
              <input
                type="number"
                aria-labelledby="qty-label"
                min={1}
                max={maxQty}
                value={qty}
                disabled={!selected}
                onChange={(e) => changeQty(Number(e.target.value))}
              />
              <button type="button" aria-label="Increase quantity" disabled={!selected || qty >= maxQty} onClick={() => changeQty(qty + 1)}>
                <Plus size={16} />
              </button>
            </div>
            {selected && <span className="muted qty-max">Max {maxQty} available</span>}
          </div>

          <button
            className="btn btn-primary btn-block"
            disabled={!selected}
            onClick={() => selected && setAdded(`${qty} × ${product.name} (size ${selected.size}) added to your bag.`)}
          >
            {selected ? <><ShoppingBag size={18} aria-hidden="true" /> Add {qty} to Bag · {formatPrice(product.price * qty)}</> : 'Select a size'}
          </button>
          {added && <p className="notice" role="status"><Check size={16} aria-hidden="true" /> {added}</p>}

          <ul className="tags" aria-label="Tags">
            {product.search_tags.map((t) => (
              <li key={t}><Tag size={12} aria-hidden="true" /> {t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
