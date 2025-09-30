import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

export default function Cart(){
  const { slug } = useParams()
  const [items, setItems] = useState([])

  const read = () => {
    try { setItems(JSON.parse(localStorage.getItem(`cart:${slug}`)) || []) } catch { setItems([]) }
  }

  useEffect(() => { read() }, [slug])

  const write = (arr) => {
    localStorage.setItem(`cart:${slug}`, JSON.stringify(arr));
    window.dispatchEvent(new CustomEvent('cart:updated'))
    setItems(arr)
  }

  const inc = (id) => write(items.map(i=> i.id===id ? { ...i, qty: (i.qty||1)+1 } : i))
  const dec = (id) => write(items.map(i=> i.id===id ? { ...i, qty: Math.max(1,(i.qty||1)-1) } : i))
  const remove = (id) => write(items.filter(i=> i.id!==id))

  return (
    <div className="container">
      <div className="header"><div className="logo">Корзина</div></div>
      {items.length===0 ? (
        <div style={{color:'#6b7280'}}>Корзина пуста</div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {items.map(i=> (
            <div key={i.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', border:'1px solid #eef2ff', borderRadius:12, padding:10}}>
              <div style={{fontWeight:600}}>{i.title}</div>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <button onClick={()=>dec(i.id)} className="modal-count-btn">-</button>
                <span className="modal-count-value">{i.qty||1}</span>
                <button onClick={()=>inc(i.id)} className="modal-count-btn">+</button>
                <button onClick={()=>remove(i.id)} className="delete-technique-btn" style={{padding:'6px 10px'}}>Удалить</button>
              </div>
            </div>
          ))}
          <div style={{display:'flex', justifyContent:'space-between', fontWeight:700}}>
            <div>Итого</div>
            <div>{items.reduce((s,i)=> s + (i.qty||1)*(i.price||0), 0).toLocaleString()} сум</div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  )
}





