import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchCategories, fetchStoreBySlug } from '../api'
import BottomNav from '../components/BottomNav'

export default function Categories(){
  const { slug } = useParams()
  const navigate = useNavigate()
  const [store, setStore] = useState(null)
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([fetchStoreBySlug(slug), fetchCategories(slug)])
      .then(([storeData, cats]) => { setStore(storeData); setCategories(cats) })
      .catch(console.error)
  }, [slug])

  const filtered = categories.filter(c => (c.name||'').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="container">
      <div className="header">{store?.logo_url ? <img src={`http://localhost:8000${store.logo_url}`} alt="logo" className="logo" /> : <div className="logo">LOGO</div>}</div>
      <input className="search" placeholder="Поиск..." value={search} onChange={e=>setSearch(e.target.value)} />
      <div className="section-title">Категории</div>
      <div className="cat-list">
        {filtered.map(cat => (
          <button key={cat.id} className="cat-item" onClick={() => navigate(`/${slug}/catalog/${cat.id}`)}>
            <span className="cat-name">{(cat.name || '').charAt(0).toUpperCase() + (cat.name || '').slice(1)}</span>
            <span className="cat-chevron" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
        ))}
      </div>
      <BottomNav />
    </div>
  )
}


