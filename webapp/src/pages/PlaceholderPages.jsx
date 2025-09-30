import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchStoreBySlug } from '../api'
import BottomNav from '../components/BottomNav'

export function OrderPage(){
  const { slug } = useParams()
  const navigate = useNavigate()
  const [store, setStore] = useState(null)

  useEffect(() => {
    fetchStoreBySlug(slug).then(setStore).catch(console.error)
  }, [slug])

  const extractMapLink = (raw) => {
    if (!raw) return null;
    const m = /src=["']([^"']+)["']/.exec(raw);
    if (m && m[1]) return m[1];
    const t = String(raw).trim();
    if (t.startsWith('http://') || t.startsWith('https://')) return t;
    return null;
  }

  return (
    <div className="container">
      <div className="header">{store?.logo_url ? <img src={`http://localhost:8000${store.logo_url}`} alt="logo" className="logo" /> : <div className="logo">LOGO</div>}</div>
      <div className="details-section info-card">
        <div className="block-title">Как заказать</div>
        <div className="contact-list">
          {store?.address && (<div>Адрес: <strong>{store.address}</strong></div>)}
          {store?.phone && (<div>Телефон: <a href={`tel:${store.phone}`}><strong>{store.phone}</strong></a></div>)}
          {(!store?.address && !store?.phone) && (<div>Контактная информация пока не добавлена.</div>)}
        </div>
      </div>
      {(store?.map_iframe) && (
        <div className="details-section info-card">
          <div className="block-title">Мы на карте</div>
          {String(store.map_iframe).includes('<iframe') && (
            <div className="map-container" dangerouslySetInnerHTML={{ __html: store.map_iframe }} />
          )}
          {extractMapLink(store.map_iframe) && (
            <div style={{marginTop:10}}><a href={extractMapLink(store.map_iframe)} target="_blank" rel="noreferrer">Открыть на карте</a></div>
          )}
        </div>
      )}
      <BottomNav />
    </div>
  )
}

export function AboutPage(){
  const { slug } = useParams()
  const [store, setStore] = useState(null)

  useEffect(() => {
    fetchStoreBySlug(slug).then(setStore).catch(console.error)
  }, [slug])

  const extractMapLink = (raw) => {
    if (!raw) return null;
    const m = /src=["']([^"']+)["']/.exec(raw);
    if (m && m[1]) return m[1];
    const t = String(raw).trim();
    if (t.startsWith('http://') || t.startsWith('https://')) return t;
    return null;
  }

  return (
    <div className="container">
      <div className="header">{store?.logo_url ? <img src={`http://localhost:8000${store.logo_url}`} alt="logo" className="logo" /> : <div className="logo">LOGO</div>}</div>
      <div className="details-section info-card">
        <div className="block-title">О нас</div>
        <div className="details-text">
          {store?.about_html ? (
            <div dangerouslySetInnerHTML={{ __html: store.about_html }} />
          ) : (
            <p>Информация о магазине пока не добавлена.</p>
          )}
        </div>
      </div>
      <div className="details-section info-card">
        <div className="block-title">Контакты</div>
        <div className="contact-list">
          {store?.address && (<div>Адрес: <strong>{store.address}</strong></div>)}
          {store?.phone && (<div>Телефон: <a href={`tel:${store.phone}`}><strong>{store.phone}</strong></a></div>)}
          {(!store?.address && !store?.phone) && (<div>Контакты пока не добавлены.</div>)}
        </div>
      </div>
      {store?.map_iframe && (
        <div className="details-section info-card">
          <div className="block-title">Мы на карте</div>
          {String(store.map_iframe).includes('<iframe') && (
            <div className="map-container" dangerouslySetInnerHTML={{ __html: store.map_iframe }} />
          )}
          {extractMapLink(store.map_iframe) && (
            <div style={{marginTop:10}}><a href={extractMapLink(store.map_iframe)} target="_blank" rel="noreferrer">Открыть на карте</a></div>
          )}
        </div>
      )}
      {(store?.telegram || store?.instagram) && (
        <div className="details-section info-card">
          <div className="block-title">Социальные сети</div>
          <div className="social-list">
            {store?.telegram && (<div>Telegram: <a href={store.telegram} target="_blank" rel="noreferrer">{store.telegram}</a></div>)}
            {store?.instagram && (<div>Instagram: <a href={store.instagram} target="_blank" rel="noreferrer">{store.instagram}</a></div>)}
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  )
}


