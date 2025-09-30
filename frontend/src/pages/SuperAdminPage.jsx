import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaStore, FaUserPlus, FaTimes, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { fetchStores, createStore, deleteStore, updateStore, uploadLogo } from '../api/stores';
import { createUser } from '../api/users';
import './SuperAdminPage.css';
import AdminSupportChat from '../components/AdminSupportChat';

const SuperAdminPage = () => {
  const [stores, setStores] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stores'); // 'stores' | 'webapp'
  const [error, setError] = useState('');

  const [newStore, setNewStore] = useState({
    name: '',
    slug: '',
    address: '',
    phone: '',
    email: '',
    is_active: true
  });
  const [webappSettings, setWebappSettings] = useState({ logo_url: '', about_html: '', map_iframe: '', telegram: '', instagram: '' });
  const [pendingWebapp, setPendingWebapp] = useState({}); // storeId -> partial settings
  const [pendingLogo, setPendingLogo] = useState({}); // storeId -> File

  const [newAdmin, setNewAdmin] = useState({
    email: '',
    password: '',
    full_name: '',
    store_id: null,
    role: 'store_admin'
  });

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      setError('');
      const storesData = await fetchStores();
      setStores(storesData);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError('Ошибка загрузки магазинов: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await createStore(newStore);
      setShowCreateModal(false);
      setNewStore({ name: '', address: '', phone: '', email: '', is_active: true });
      await loadStores();
      alert('Магазин создан успешно!');
    } catch (err) {
      console.error('Error creating store:', err);
      setError('Ошибка создания магазина: ' + err.message);
    }
  };

  const handleCreateStoreAdmin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await createUser(newAdmin);
      setShowCreateAdminModal(false);
      setNewAdmin({ email: '', password: '', full_name: '', store_id: null, role: 'store_admin' });
      alert('Администратор магазина создан успешно!');
    } catch (err) {
      console.error('Error creating admin:', err);
      setError('Ошибка создания администратора: ' + err.message);
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот магазин?')) {
      try {
        setError('');
        await deleteStore(storeId);
        await loadStores();
        alert('Магазин удален успешно!');
      } catch (err) {
        console.error('Error deleting store:', err);
        setError('Ошибка удаления магазина: ' + err.message);
      }
    }
  };

  const handleInputChange = (e, formType) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    if (formType === 'store') {
      // автогенерация slug из name (можно переписать вручную)
      if (name === 'name' && !newStore.slug) {
        const gen = value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
        setNewStore(prev => ({ ...prev, name: value, slug: gen }));
      } else {
        setNewStore(prev => ({ ...prev, [name]: newValue }));
      }
    } else if (formType === 'admin') {
      setNewAdmin(prev => ({ ...prev, [name]: newValue }));
    }
  };

  if (loading) {
    return (
      <div className="super-admin-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="super-admin-page">
      <div className="header">
        <h1>Панель управления системой</h1>
        <p>Управление магазинами и администраторами</p>
      </div>

      {/* Чаты с магазинами */}
      <div style={{marginBottom:40}}>
        <h2 style={{color:'#2d3748', fontWeight:700, fontSize: '1.5rem', marginBottom:16}}>Чаты с магазинами</h2>
        <AdminSupportChat />
      </div>

      {error && (
        <div className="error-banner">
          <FaExclamationTriangle />
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <FaStore className="stat-icon" />
          <div className="stat-content">
            <h3>{stores.length}</h3>
            <p>Магазинов</p>
          </div>
        </div>
        <div className="stat-card">
          <FaUserPlus className="stat-icon" />
          <div className="stat-content">
            <h3>{stores.filter(s => s.is_active).length}</h3>
            <p>Активных магазинов</p>
          </div>
        </div>
      </div>

      <div className="actions">
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <FaPlus /> Создать магазин
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => setShowCreateAdminModal(true)}
        >
          <FaUserPlus /> Создать админа
        </button>
      </div>

      {/* Табы */}
      <div className="tabs" style={{display:'flex', gap:10, margin:'0 0 16px 0', justifyContent:'center'}}>
        <button className={`tab ${activeTab==='stores'?'active':''}`} onClick={()=>setActiveTab('stores')}>Магазины</button>
        <button className={`tab ${activeTab==='webapp'?'active':''}`} onClick={()=>setActiveTab('webapp')}>Web App</button>
      </div>

      {activeTab==='stores' && (
      <div className="stores-list">
        <h2>Список магазинов</h2>
        <div className="stores-grid">
          {stores.map(store => (
            <div key={store.id} className="store-card">
              <div className="store-header">
                {store.logo_url ? (
                  <img src={store.logo_url.startsWith('http')?store.logo_url:`http://localhost:8000${store.logo_url}`} alt={store.name} style={{width:42,height:42,objectFit:'contain', borderRadius:10, background:'#f8fafd'}} onError={(e)=>{e.currentTarget.style.display='none'}} />
                ) : (
                  <FaStore className="store-icon" />
                )}
                <div className="store-info">
                  <h3>{store.name}</h3>
                  <span className={`status ${store.is_active ? 'active' : 'inactive'}`}>
                    {store.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>
              <div className="store-details" style={{display:'grid', gap:8}}>
                <div style={{display:'grid', gridTemplateColumns:'120px 1fr', alignItems:'center', gap:8}}>
                  <strong>Адрес:</strong>
                  <input
                    type="text"
                    value={(pendingWebapp[store.id]?.address) ?? (store.address || '')}
                    onChange={(e)=> setPendingWebapp(prev => ({ ...prev, [store.id]: { ...(prev[store.id]||{}), address: e.target.value } }))}
                  />
                </div>
                <div style={{display:'grid', gridTemplateColumns:'120px 1fr', alignItems:'center', gap:8}}>
                  <strong>Телефон:</strong>
                  <input
                    type="tel"
                    value={(pendingWebapp[store.id]?.phone) ?? (store.phone || '')}
                    onChange={(e)=> setPendingWebapp(prev => ({ ...prev, [store.id]: { ...(prev[store.id]||{}), phone: e.target.value } }))}
                  />
                </div>
                <div style={{display:'grid', gridTemplateColumns:'120px 1fr', alignItems:'center', gap:8}}>
                  <strong>Email:</strong>
                  <input
                    type="email"
                    value={(pendingWebapp[store.id]?.email) ?? (store.email || '')}
                    onChange={(e)=> setPendingWebapp(prev => ({ ...prev, [store.id]: { ...(prev[store.id]||{}), email: e.target.value } }))}
                  />
                </div>
                <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                  <button 
                    className="btn btn-small btn-secondary"
                    onClick={()=> setPendingWebapp(prev => { const copy = { ...prev }; delete copy[store.id]; return copy; })}
                  >Отмена</button>
                  <button 
                    className="btn btn-small btn-primary"
                    onClick={async()=>{
                      const base = pendingWebapp[store.id] || {};
                      // фильтруем только поля адрес/телефон/email если менялись
                      const payload = {};
                      ['address','phone','email'].forEach(k => { if (k in base) payload[k] = base[k]; });
                      if (Object.keys(payload).length === 0) return;
                      await updateStore(store.id, payload);
                      setPendingWebapp(prev => { const copy = { ...prev }; delete copy[store.id]; return copy; });
                      await loadStores();
                    }}
                  >Сохранить</button>
                </div>
              </div>
              <div className="store-actions">
                {store.slug && (
                  <a className="btn btn-small btn-outline" href={`http://localhost:5174/${store.slug}`} target="_blank" rel="noreferrer">Открыть витрину</a>
                )}
                <button 
                  className="btn btn-small btn-secondary"
                  onClick={() => {
                    setSelectedStore(store);
                    setNewAdmin({ ...newAdmin, store_id: store.id });
                    setShowCreateAdminModal(true);
                  }}
                >
                  <FaUserPlus /> Добавить админа
                </button>
                <button 
                  className="btn btn-small btn-danger"
                  onClick={() => handleDeleteStore(store.id)}
                >
                  <FaTrash /> Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {activeTab==='webapp' && (
      <div className="stores-list">
        <h2>Web App настройки</h2>
        <div className="stores-grid">
          {stores.map(store => (
            <div key={store.id} className="store-card">
              <div className="store-header">
                {store.logo_url ? (
                  <img src={store.logo_url.startsWith('http')?store.logo_url:`http://localhost:8000${store.logo_url}`} alt={store.name} style={{width:42,height:42,objectFit:'contain', borderRadius:10, background:'#f8fafd'}} onError={(e)=>{e.currentTarget.style.display='none'}} />
                ) : (
                  <FaStore className="store-icon" />
                )}
                <div className="store-info">
                  <h3>{store.name}</h3>
                  {store.slug && <a href={`http://localhost:5174/${store.slug}`} target="_blank" rel="noreferrer" style={{fontSize:12}}>Открыть витрину →</a>}
                </div>
              </div>
              <div className="store-details" style={{display:'grid', gap:12}}>
                <div>
                  <label>Логотип (PNG/SVG)</label>
                  <div style={{display:'flex', alignItems:'center', gap:12, flexWrap:'wrap'}}>
                    {pendingLogo[store.id] ? (
                      <img src={URL.createObjectURL(pendingLogo[store.id])} alt="preview" style={{width:42,height:42,objectFit:'contain', borderRadius:10, background:'#f8fafd', border:'1px solid #e2e8f0'}} />
                    ) : (
                      store.logo_url ? <img src={store.logo_url.startsWith('http')?store.logo_url:`http://localhost:8000${store.logo_url}`} alt="logo" style={{width:42,height:42,objectFit:'contain', borderRadius:10, background:'#f8fafd', border:'1px solid #e2e8f0'}} /> : null
                    )}
                    <input 
                      type="file" 
                      accept="image/png,image/svg+xml,image/jpeg"
                      onChange={(e)=>{
                        const f = e.target.files?.[0];
                        if (f) setPendingLogo(prev => ({ ...prev, [store.id]: f }));
                      }} 
                    />
                    <button 
                      className="btn btn-small btn-primary" 
                      disabled={!pendingLogo[store.id]}
                      onClick={async()=>{
                        const f = pendingLogo[store.id];
                        if (!f) return;
                        try {
                          const res = await uploadLogo(f);
                          const logo_url = res.url || (res.filename ? `/upload/image/${res.filename}` : '');
                          if (!logo_url) throw new Error('Некорректный ответ загрузки');
                          await updateStore(store.id, { logo_url });
                          setPendingLogo(prev => { const copy = { ...prev }; delete copy[store.id]; return copy; });
                          await loadStores();
                        } catch (err) {
                          alert('Ошибка загрузки: ' + err.message);
                        }
                      }}
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
                <div>
                  <label>Описание (HTML/текст)</label>
                  <textarea 
                    rows={4}
                    value={(pendingWebapp[store.id]?.about_html) ?? (store.about_html || '')}
                    onChange={(e)=> setPendingWebapp(prev => ({ ...prev, [store.id]: { ...(prev[store.id]||{}), about_html: e.target.value } }))}
                  />
                </div>
                <div>
                  <label>Карта (iframe)</label>
                  <textarea 
                    rows={3}
                    placeholder="<iframe ...>"
                    value={(pendingWebapp[store.id]?.map_iframe) ?? (store.map_iframe || '')}
                    onChange={(e)=> setPendingWebapp(prev => ({ ...prev, [store.id]: { ...(prev[store.id]||{}), map_iframe: e.target.value } }))}
                  />
                  <small>Можно вставить полный iframe или ссылку на карту (например: https://yandex.uz/maps/...)</small>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                  <input 
                    placeholder="Telegram"
                    value={(pendingWebapp[store.id]?.telegram) ?? (store.telegram || '')}
                    onChange={(e)=> setPendingWebapp(prev => ({ ...prev, [store.id]: { ...(prev[store.id]||{}), telegram: e.target.value } }))}
                  />
                  <input 
                    placeholder="Instagram"
                    value={(pendingWebapp[store.id]?.instagram) ?? (store.instagram || '')}
                    onChange={(e)=> setPendingWebapp(prev => ({ ...prev, [store.id]: { ...(prev[store.id]||{}), instagram: e.target.value } }))}
                  />
                  <div style={{gridColumn:'1 / span 2', display:'flex', justifyContent:'flex-end', marginTop:8, gap:8}}>
                    <button 
                      className="btn btn-small btn-secondary"
                      onClick={()=> setPendingWebapp(prev => { const copy = { ...prev }; delete copy[store.id]; return copy; })}
                    >Отмена</button>
                    <button 
                      className="btn btn-small btn-primary"
                      onClick={async()=>{
                        let payload = pendingWebapp[store.id] || {};
                        // Если пользователь вставил ссылку на карту, оборачиваем в iframe
                        if (payload.map_iframe && !payload.map_iframe.includes('<iframe')) {
                          const url = payload.map_iframe.trim();
                          payload = { ...payload, map_iframe: `<iframe src="${url}" width="100%" height="300" frameborder="0" style="border:0" allowfullscreen></iframe>` };
                        }
                        if (Object.keys(payload).length === 0) return;
                        await updateStore(store.id, payload);
                        setPendingWebapp(prev => { const copy = { ...prev }; delete copy[store.id]; return copy; });
                        await loadStores();
                      }}
                    >Сохранить</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Modal для создания магазина */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Создать магазин</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateStore}>
              <div className="form-group">
                <label>Название магазина *</label>
                <input
                  type="text"
                  name="name"
                  value={newStore.name}
                  onChange={(e) => handleInputChange(e, 'store')}
                  required
                />
              </div>
              <div className="form-group">
                <label>Путь WebApp (slug) *</label>
                <input
                  type="text"
                  name="slug"
                  value={newStore.slug}
                  onChange={(e) => handleInputChange(e, 'store')}
                  placeholder="например: stillist_store"
                  required
                />
                <small>Ссылка WebApp: https://your-domain/{newStore.slug || 'slug'}</small>
              </div>
              <div className="form-group">
                <label>Адрес</label>
                <input
                  type="text"
                  name="address"
                  value={newStore.address}
                  onChange={(e) => handleInputChange(e, 'store')}
                />
              </div>
              <div className="form-group">
                <label>Телефон</label>
                <input
                  type="tel"
                  name="phone"
                  value={newStore.phone}
                  onChange={(e) => handleInputChange(e, 'store')}
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={newStore.email}
                  onChange={(e) => handleInputChange(e, 'store')}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={newStore.is_active}
                    onChange={(e) => handleInputChange(e, 'store')}
                  />
                  Активен
                </label>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  <FaCheckCircle /> Создать
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal для создания админа */}
      {showCreateAdminModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateAdminModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Создать администратора магазина</h2>
              <button className="modal-close" onClick={() => setShowCreateAdminModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateStoreAdmin}>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={newAdmin.email}
                  onChange={(e) => handleInputChange(e, 'admin')}
                  required
                />
              </div>
              <div className="form-group">
                <label>Пароль *</label>
                <input
                  type="password"
                  name="password"
                  value={newAdmin.password}
                  onChange={(e) => handleInputChange(e, 'admin')}
                  required
                />
              </div>
              <div className="form-group">
                <label>Полное имя *</label>
                <input
                  type="text"
                  name="full_name"
                  value={newAdmin.full_name}
                  onChange={(e) => handleInputChange(e, 'admin')}
                  required
                />
              </div>
              {selectedStore && (
                <div className="form-group">
                  <label>Магазин</label>
                  <input
                    type="text"
                    value={selectedStore.name}
                    disabled
                  />
                </div>
              )}
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  <FaCheckCircle /> Создать
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateAdminModal(false)}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPage; 