import React, { useState, useRef, useEffect } from 'react';
import './SupportChat.css';
import logo from '../assets/logo.png';
import { fetchSupportMessages, sendSupportMessage } from '../api/support';

const SupportChat = ({ open, onClose, user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const [greeted, setGreeted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user?.store_id) {
      setMessages([]);
      setGreeted(false);
      setLoading(true);
      fetchSupportMessages(user.store_id)
        .then(msgs => {
          setMessages(msgs.map(m => ({
            id: m.id,
            from: m.sender_role === 'store' ? 'me' : 'admin',
            text: m.text,
            time: new Date(m.created_at).toLocaleTimeString().slice(0,5)
          })));
        })
        .finally(() => {
          setTimeout(() => {
            setGreeted(true);
            setLoading(false);
          }, 1000);
        });
    }
  }, [open, user]);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  const handleSend = async () => {
    if (!input.trim() || !user?.store_id || !user?.id) return;
    const msgData = {
      store_id: user.store_id,
      sender_role: 'store',
      sender_id: user.id,
      text: input
    };
    try {
      const sent = await sendSupportMessage(msgData);
      setMessages([...messages, {
        id: sent.id,
        from: 'me',
        text: sent.text,
        time: new Date(sent.created_at).toLocaleTimeString().slice(0,5)
      }]);
      setInput('');
    } catch (e) {
      alert('Ошибка отправки сообщения');
    }
  };

  if (!open) return null;

  return (
    <div className="support-chat-overlay" onClick={onClose}>
      <div className="support-chat-modal" onClick={e => e.stopPropagation()}>
        <div className="support-chat-header">
          <img src={logo} alt="logo" className="support-chat-logo" />
          <span className="support-chat-title">Support — Чат с админом</span>
          <button className="support-chat-close" onClick={onClose}>×</button>
        </div>
        <div className="support-chat-messages">
          {loading ? <div style={{color:'#aaa', textAlign:'center', marginTop:40}}>Загрузка...</div> : null}
          {messages.map(msg => (
            <div key={msg.id} className={`support-chat-message ${msg.from === 'me' ? 'me' : 'admin'}`}> 
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
            disabled={!greeted || loading}
          />
          <button className="support-chat-send" onClick={handleSend} disabled={!greeted || loading}>Отправить</button>
        </div>
      </div>
    </div>
  );
};

export default SupportChat; 