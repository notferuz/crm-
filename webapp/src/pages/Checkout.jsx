import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { createOrder } from '../api'

export default function Checkout(){
  const { state } = useLocation()
  const { slug } = useParams()
  const navigate = useNavigate()
  const [contact, setContact] = useState('')
  const [days, setDays] = useState(1)
  const cart = state?.cart || []

  const submit = async () => {
    if (!cart.length) return navigate(`/${slug}`)
    const items = cart.map(i=>({ equipment_id: i.id, qty: i.qty || 1, price_per_day: i.price }))
    await createOrder({ store_slug: slug, items, contact, days })
    alert('Заказ отправлен!')
    navigate(`/${slug}`)
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Оформление заказа</h2>
      <div style={{ margin:'12px 0' }}>
        <label>Контакт для связи</label>
        <input value={contact} onChange={e=>setContact(e.target.value)} style={{ width:'100%', padding:12, borderRadius:12, border:'1px solid #e5e7eb' }} placeholder="Телефон или имя" />
      </div>
      <div style={{ margin:'12px 0' }}>
        <label>Количество дней</label>
        <input type="number" min={1} value={days} onChange={e=>setDays(Number(e.target.value)||1)} style={{ width:'100%', padding:12, borderRadius:12, border:'1px solid #e5e7eb' }} />
      </div>
      <div style={{ background:'#fff', border:'1px solid #eef2ff', borderRadius:12, padding:12, marginBottom:12 }}>
        {cart.map(i=> (
          <div key={i.id} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <div>{i.title} × {i.qty||1}</div>
            <div>{((i.qty||1)*(i.price||0)).toLocaleString()} сум</div>
          </div>
        ))}
        <div style={{ display:'flex', justifyContent:'space-between', fontWeight:600, borderTop:'1px solid #e5e7eb', paddingTop:8 }}>
          <div>Итого</div>
          <div>{cart.reduce((s,i)=>s+(i.qty||1)*(i.price||0),0).toLocaleString()} сум</div>
        </div>
      </div>
      <button onClick={submit} style={{ width:'100%', padding:12, borderRadius:12, background:'#3b82f6', color:'#fff', border:'none' }}>Отправить заказ</button>
    </div>
  )
}


