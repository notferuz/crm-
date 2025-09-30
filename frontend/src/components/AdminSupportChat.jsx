import React, { useState, useRef, useEffect } from 'react';
import './SupportChat.css';
import logo from '../assets/logo.png';
import { fetchStores } from '../api/stores';
import { fetchSupportMessages, sendSupportMessage } from '../api/support';

const AdminSupportChat = () => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setLoadingStores(true);
    fetchStores()
      .then(data => {
        setStores(data);
        if (data.length > 0) setSelectedStore(data[0]);
      })
      .catch(e => setError('Ошибка загрузки магазинов'))
      .finally(() => setLoadingStores(false));
  }, []);

  useEffect(() => {
    if (selectedStore) {
      setLoadingMessages(true);
      fetchSupportMessages(selectedStore.id)
        .then(msgs => {
          setMessages(msgs.map(m => ({
            id: m.id,
            from: m.sender_role === 'admin' ? 'admin' : 'store',
            text: m.text,
            time: new Date(m.created_at).toLocaleTimeString().slice(0,5)
          })));
        })
        .catch(() => setMessages([]))
        .finally(() => setLoadingMessages(false));
    }
  }, [selectedStore]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedStore) return;
    const msgData = {
      store_id: selectedStore.id,
      sender_role: 'admin',
      sender_id: 0, // Можно заменить на реальный id супер-админа, если есть
      text: input
    };
    try {
      const sent = await sendSupportMessage(msgData);
      setMessages([...messages, {
        id: sent.id,
        from: 'admin',
        text: sent.text,
        time: new Date(sent.created_at).toLocaleTimeString().slice(0,5)
      }]);
      setInput('');
    } catch (e) {
      alert('Ошибка отправки сообщения');
    }
  };

  return (
    <div style={{display:'flex', background:'#fff', borderRadius:18, boxShadow:'0 4px 32px rgba(0,0,0,0.07)', minHeight:400, maxWidth:900, margin:'32px auto', overflow:'hidden'}}>
      <div style={{width:220, background:'#f7f8fa', borderRight:'1px solid #eee', padding:'0', display:'flex', flexDirection:'column'}}>
        <div style={{padding:'18px 16px', fontWeight:700, fontSize:18, borderBottom:'1px solid #eee'}}>Магазины</div>
        <div style={{flex:1, overflowY:'auto'}}>
          {loadingStores ? <div style={{color:'#aaa', textAlign:'center', marginTop:40}}>Загрузка...</div> : null}
          {stores.map(store => (
            <div
              key={store.id}
              onClick={() => setSelectedStore(store)}
              style={{
                padding:'14px 16px',
                cursor:'pointer',
                background: selectedStore && selectedStore.id === store.id ? '#eaf2ff' : 'none',
                color: selectedStore && selectedStore.id === store.id ? '#397DFF' : '#222',
                fontWeight: selectedStore && selectedStore.id === store.id ? 600 : 400,
                borderLeft: selectedStore && selectedStore.id === store.id ? '4px solid #397DFF' : '4px solid transparent',
                transition:'background 0.2s',
              }}
            >
              <img src={logo} alt="logo" style={{width:24, height:24, borderRadius:6, marginRight:8, verticalAlign:'middle'}} />
              {store.name}
            </div>
          ))}
        </div>
      </div>
      <div style={{flex:1, display:'flex', flexDirection:'column'}}>
        <div className="support-chat-header" style={{borderRadius:0}}>
          <img src={logo} alt="logo" className="support-chat-logo" />
          <span className="support-chat-title">Чат с: {selectedStore ? selectedStore.name : ''}</span>
        </div>
        <div className="support-chat-messages" style={{flex:1, minHeight:200, maxHeight:320}}>
          {loadingMessages ? <div style={{color:'#aaa', textAlign:'center', marginTop:40}}>Загрузка...</div> : null}
          {messages.length === 0 && !loadingMessages && <div style={{color:'#aaa', textAlign:'center', marginTop:40}}>Нет сообщений</div>}
          {messages.map(msg => (
            <div key={msg.id} className={`support-chat-message ${msg.from === 'admin' ? 'me' : 'admin'}`}> 
              <div className="support-chat-msg-text">{msg.text}</div>
              <div className="support-chat-msg-time">{msg.time}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="support-chat-input-row">
          <input
            type="text"
            className="support-chat-input"
            placeholder="Введите сообщение..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={!selectedStore}
          />
          <button className="support-chat-send" onClick={handleSend} disabled={!selectedStore}>Отправить</button>
        </div>
      </div>
    </div>
  );
};

export default AdminSupportChat; 