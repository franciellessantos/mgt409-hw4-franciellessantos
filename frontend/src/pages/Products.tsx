import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, Search, SlidersHorizontal, X } from 'lucide-react'
import { fetchProducts, formatPrice, type Product } from '../api'
import ProductCard from '../components/ProductCard'
import { useChatResults } from '../ChatResultsContext'

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const TYPE_ORDER = ['T-Shirts', 'Hoodies', 'Crewnecks', 'Quarter-Zips', 'Jackets', 'Others']

interface PriceBand {
  label: string
  min: number
  max: number
}

/** Split the catalogue's price range into 4 bands, rounded to whole dollars. */
function buildPriceBands(products: Product[]): PriceBand[] {
  if (products.length === 0) return []
  const prices = products.map((p) => p.price)
  const min = Math.round(Math.min(...prices))
  const max = Math.round(Math.max(...prices))
  const step = Math.round((max - min) / 4) || 1
  const bands: PriceBand[] = []
  for (let i = 0; i < 4; i++) {
    const lo = min + step * i
    const hi = i === 3 ? max : min + step * (i + 1) - 1
    bands.push({ label: `${formatPrice(lo)} – ${formatPrice(hi)}`, min: lo, max: i === 3 ? max : min + step * (i + 1) })
  }
  return bands
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [query, setQuery] = useState('')
  const { results, query: chatQuery, clear } = useChatResults()

  const [sizes, setSizes] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [bands, setBands] = useState<number[]>([]) // indices into priceBands
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProducts(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  const allSizes = useMemo(
    () => SIZE_ORDER.filter((s) => products.some((p) => p.available_sizes?.includes(s))),
    [products],
  )
  const allColors = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => p.colors.forEach((c) => set.add(c.toLowerCase().trim())))
    return [...set].sort()
  }, [products])
  const allTypes = useMemo(() => {
    const present = new Set(products.map((p) => p.category ?? 'Others'))
    return TYPE_ORDER.filter((t) => present.has(t))
  }, [products])
  const priceBands = useMemo(() => buildPriceBands(products), [products])

  const activeCount = sizes.length + colors.length + types.length + bands.length
  const clearFilters = () => {
    setSizes([])
    setColors([])
    setTypes([])
    setBands([])
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (q && ![p.name, p.garment_type, p.description, ...p.colors, ...p.search_tags].join(' ').toLowerCase().includes(q))
        return false
      if (sizes.length && !sizes.some((s) => p.available_sizes?.includes(s))) return false
      if (colors.length && !colors.some((c) => p.colors.map((x) => x.toLowerCase().trim()).includes(c)))
        return false
      if (types.length && !types.includes(p.category ?? 'Others')) return false
      if (bands.length && !bands.some((i) => p.price >= priceBands[i].min && p.price <= priceBands[i].max))
        return false
      return true
    })
  }, [products, query, sizes, colors, types, bands, priceBands])

  const showingChat = results.length > 0

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">Shop</p>
          <h1>All Products</h1>
        </div>
      </section>

      {showingChat ? (
        <section className="container section results-banner">
          <div className="results-head">
            <p className="results-title">
              <MessageCircle size={18} aria-hidden="true" /> Handsome Dan found {results.length}{' '}
              {results.length === 1 ? 'item' : 'items'} for “{chatQuery}”
            </p>
            <button className="btn btn-outline" onClick={clear}>
              <X size={16} aria-hidden="true" /> Show all products
            </button>
          </div>
          <div className="product-grid">
            {results.map((p) => <ProductCard key={p.product_id} product={p} />)}
          </div>
        </section>
      ) : (
        <section className="container section shop-layout">
          <aside className={`filters ${filtersOpen ? 'open' : ''}`} aria-label="Product filters">
            <div className="filters-head">
              <h2><SlidersHorizontal size={18} aria-hidden="true" /> Filters</h2>
              {activeCount > 0 && (
                <button className="link-clear" onClick={clearFilters}>Clear ({activeCount})</button>
              )}
            </div>

            {allTypes.length > 0 && (
              <fieldset className="filter-group">
                <legend>Type</legend>
                {allTypes.map((t) => (
                  <label key={t} className="filter-opt">
                    <input type="checkbox" checked={types.includes(t)} onChange={() => setTypes(toggle(types, t))} />
                    {t}
                  </label>
                ))}
              </fieldset>
            )}

            {allSizes.length > 0 && (
              <fieldset className="filter-group">
                <legend>Size</legend>
                <div className="size-chips">
                  {allSizes.map((s) => (
                    <label key={s} className={`size-chip ${sizes.includes(s) ? 'active' : ''}`}>
                      <input type="checkbox" checked={sizes.includes(s)} onChange={() => setSizes(toggle(sizes, s))} />
                      {s}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {priceBands.length > 0 && (
              <fieldset className="filter-group">
                <legend>Price</legend>
                {priceBands.map((b, i) => (
                  <label key={b.label} className="filter-opt">
                    <input type="checkbox" checked={bands.includes(i)} onChange={() => setBands(toggle(bands, i))} />
                    {b.label}
                  </label>
                ))}
              </fieldset>
            )}

            {allColors.length > 0 && (
              <fieldset className="filter-group">
                <legend>Color</legend>
                <div className="filter-scroll">
                  {allColors.map((c) => (
                    <label key={c} className="filter-opt">
                      <input type="checkbox" checked={colors.includes(c)} onChange={() => setColors(toggle(colors, c))} />
                      <span className="color-name">{c}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </aside>

          <div className="shop-main">
            <div className="toolbar">
              <label className="search">
                <Search size={18} aria-hidden="true" />
                <span className="sr-only">Search products</span>
                <input
                  type="search"
                  placeholder="Search hoodies, tees, colors…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <button className="btn btn-outline filters-toggle" onClick={() => setFiltersOpen(!filtersOpen)}>
                <SlidersHorizontal size={16} aria-hidden="true" /> Filters{activeCount ? ` (${activeCount})` : ''}
              </button>
              {status === 'ready' && <p className="muted">{visible.length} items</p>}
            </div>

            {status === 'loading' && <p className="muted">Loading products…</p>}
            {status === 'error' && <p className="error">We couldn't load products. Is the API running on port 8000?</p>}
            {status === 'ready' && visible.length === 0 && <p className="muted">No products match your filters.</p>}

            <div className="product-grid">
              {visible.map((p) => <ProductCard key={p.product_id} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
