import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchCategories, fetchEquipment } from '../api'
import BottomNav from '../components/BottomNav'

export default function CategoryItems(){
  const { slug, categoryId } = useParams()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [equipment, setEquipment] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([fetchCategories(slug), fetchEquipment(slug)])
      .then(([cats, items]) => { setCategories(cats); setEquipment(items) })
      .catch(console.error)
  }, [slug])

  const currentCat = useMemo(() => categories.find(c => String(c.id) === String(categoryId)), [categories, categoryId])
  const list = useMemo(() => equipment.filter(i => String(i.category_id) === String(categoryId) && (
    (i.title||'').toLowerCase().includes(search.toLowerCase()) || (i.description||'').toLowerCase().includes(search.toLowerCase())
  )), [equipment, categoryId, search])

  const getImageUrl = (photos) => {
    if (!photos) return null
    if (photos.startsWith('http://') || photos.startsWith('https://')) return photos
    if (photos.startsWith('/')) return `http://localhost:8000${photos}`
    return `http://localhost:8000/upload/image/${photos}`
  }

  return (
    <div className="container">
      <div className="header"><div className="logo">LOGO</div></div>
      <input className="search" placeholder="Поиск..." value={search} onChange={e=>setSearch(e.target.value)} />

      <div className="toprow">
        <button className="back-btn" onClick={()=>navigate(`/${slug}/catalog`)} aria-label="Назад">◀</button>
        <div className="section-title" style={{margin:0}}>{(currentCat?.name||'').charAt(0).toUpperCase() + (currentCat?.name||'').slice(1)}</div>
        <div className="muted">{list.length} Товаров</div>
      </div>

      <div className="grid">
        {list.map(i => (
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

      <BottomNav />
    </div>
  )
}


