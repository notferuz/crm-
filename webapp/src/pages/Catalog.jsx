import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchCategories, fetchEquipment, fetchStoreBySlug } from '../api'
import BottomNav from '../components/BottomNav'

export default function Catalog() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [store, setStore] = useState(null)
  const [categories, setCategories] = useState([])
  const [equipment, setEquipment] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [cart, setCart] = useState([])

  const getImageUrl = (photos) => {
    if (!photos) return null
    if (photos.startsWith('http://') || photos.startsWith('https://')) return photos
    if (photos.startsWith('/')) return `http://localhost:8000${photos}`
    return `http://localhost:8000/upload/image/${photos}`
  }

  useEffect(() => {
    Promise.all([fetchStoreBySlug(slug), fetchCategories(slug), fetchEquipment(slug)])
      .then(([storeData, cats, items]) => { setStore(storeData); setCategories(cats); setEquipment(items) })
      .catch(console.error)
  }, [slug])

  const getLogoUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `http://localhost:8000${url}`
  }

  const filtered = useMemo(() => equipment.filter(i => {
    const byCat = selected.length === 0 || selected.includes(i.category_id)
    const byText = (i.title||'').toLowerCase().includes(search.toLowerCase())
      || (i.description||'').toLowerCase().includes(search.toLowerCase())
    return byCat && byText
  }), [equipment, selected, search])

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  const persistAndNotify = (arr) => {
    localStorage.setItem(`cart:${slug}`, JSON.stringify(arr))
    window.dispatchEvent(new CustomEvent('cart:updated'))
  }

  const addToCart = (item) => {
    setCart(prev => {
      const exists = prev.find(p => p.id === item.id)
      const next = exists
        ? prev.map(p => p.id===item.id ? { ...p, qty: Math.min((p.qty||1)+1, item.quantity_available||1) } : p)
        : [...prev, { id: item.id, title: item.title, qty: 1, price: item.price_per_day }]
      persistAndNotify(next)
      return next
    })
  }

  return (
    <div className="container">
      <div className="header">{store?.logo_url ? <img src={getLogoUrl(store.logo_url)} alt="logo" className="logo" /> : <div className="logo">LOGO</div>}</div>
      <input className="search" placeholder="Поиск техники" value={search} onChange={e=>setSearch(e.target.value)} />
      <div className="chips" style={{ marginTop:10, marginBottom:12 }}>
        <button onClick={()=>setSelected([])} className={selected.length===0?'chip active':'chip'}>Все</button>
        {categories.map(c => (
          <button key={c.id} onClick={()=>toggle(c.id)} className={selected.includes(c.id)?'chip active':'chip'}>{c.name}</button>
        ))}
      </div>
      <div className="section-title">Все товары</div>
      <div className="grid">
        {filtered.map(i => (
          <div key={i.id} className="card">
            <div className="card-image">
              {getImageUrl(i.photos) ? (
                <img src={getImageUrl(i.photos)} alt={i.title} onError={(e)=>{e.currentTarget.style.display='none'}} />
              ) : (
                <div className="card-image-placeholder">Нет фото</div>
              )}
            </div>
            <div className="card-title">{i.title}</div>
            <div className="card-price">{i.price_per_day?.toLocaleString()} сум/день</div>
            <button className="btn-primary" onClick={()=>navigate(`/${slug}/item/${i.id}`)}>Перейти</button>
          </div>
        ))}
      </div>
      {false && cart.length>0 && (
        <div></div>
      )}
      <BottomNav />
    </div>
  )
}


