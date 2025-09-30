import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchEquipment } from '../api'
import BottomNav from '../components/BottomNav'

export default function ItemDetails(){
  const { slug, itemId } = useParams()
  const navigate = useNavigate()
  const [items, setItems] = useState([])

  useEffect(() => { fetchEquipment(slug).then(setItems).catch(console.error) }, [slug])

  const item = useMemo(() => items.find(i => String(i.id) === String(itemId)), [items, itemId])
  const related = useMemo(() => {
    if (!item) return []
    return items.filter(i => i.id !== item.id && String(i.category_id) === String(item.category_id)).slice(0, 10)
  }, [items, item])

  const getImageUrl = (photos) => {
    if (!photos) return null
    if (photos.startsWith('http://') || photos.startsWith('https://')) return photos
    if (photos.startsWith('/')) return `http://localhost:8000${photos}`
    return `http://localhost:8000/upload/image/${photos}`
  }

  if (!item) {
    return (
      <div className="container">
        <div className="header"><div className="logo">LOGO</div></div>
        <div style={{color:'#6b7280'}}>Загрузка...</div>
        <BottomNav />
      </div>
    )
  }

  const onShare = async () => {
    const url = window.location.href
    const title = item?.title || 'Товар'
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
        alert('Ссылка скопирована')
      }
    } catch (e) { /* ignore */ }
  }

  return (
    <div className="container">
      <div className="header"><div className="logo">LOGO</div></div>
      <div className="topactions">
        <button className="back-btn" onClick={()=>navigate(-1)} aria-label="Назад">◀ Назад</button>
        <button className="share-btn" onClick={onShare} aria-label="Поделиться">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 8.5l-6 3m6 3l-6-3m10-3.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-10 6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Поделиться
        </button>
      </div>
      <div className="details-card">
        <div className="details-image">
          {getImageUrl(item.photos) ? (
            <img src={getImageUrl(item.photos)} alt={item.title} onError={(e)=>{e.currentTarget.style.display='none'}} />
          ) : (
            <div className="card-image-placeholder">Нет фото</div>
          )}
        </div>
        <div className="details-body">
          <div className="card-title" style={{fontSize:20}}>{item.title}</div>
          <div className="card-price" style={{fontSize:18}}>{item.price_per_day?.toLocaleString()} сум/день</div>
          {item.description && (
            <div className="details-section">
              <div className="details-section-title">Описание</div>
              <div className="details-text">{item.description}</div>
            </div>
          )}
        </div>
      </div>
      {related.length > 0 && (
        <div className="details-section">
          <div className="details-section-title">Похожие товары</div>
          <div className="related-scroll">
            {related.map(r => (
              <button key={r.id} className="related-card" onClick={()=>navigate(`/${slug}/item/${r.id}`)}>
                <div className="related-image">
                  {getImageUrl(r.photos) ? (
                    <img src={getImageUrl(r.photos)} alt={r.title} onError={(e)=>{e.currentTarget.style.display='none'}} />
                  ) : (
                    <div className="card-image-placeholder">Нет фото</div>
                  )}
                </div>
                <div className="related-title">{r.title}</div>
                <div className="related-price">{r.price_per_day?.toLocaleString()} сум/день</div>
              </button>
            ))}
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  )
}


