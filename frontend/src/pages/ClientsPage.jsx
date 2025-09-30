import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaPlus, FaTimes, FaImage } from 'react-icons/fa';
import './clients.css';
import { useNavigate } from 'react-router-dom';
import { fetchClients, addClient } from '../api/clients';
import { uploadImage } from '../api/upload';

function AddClientModal({ open, onClose, onClientAdded }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [organization, setOrganization] = useState('');
  const [trustedPersonName, setTrustedPersonName] = useState('');
  const [trustedPersonPhone, setTrustedPersonPhone] = useState('');
  // Доп. поля: фото клиента (лицо), ВУ, ИНН
  const [clientPhoto, setClientPhoto] = useState(null);
  const [driverLicenseNumber, setDriverLicenseNumber] = useState('');
  const [driverFront, setDriverFront] = useState(null);
  const [driverBack, setDriverBack] = useState(null);
  const [inn, setInn] = useState('');
  const [frontPhoto, setFrontPhoto] = useState(null);
  const [backPhoto, setBackPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const frontInputRef = React.useRef();
  const backInputRef = React.useRef();
  const clientPhotoRef = React.useRef();
  const driverFrontRef = React.useRef();
  const driverBackRef = React.useRef();

  if (!open) return null;

  const handlePhoto = (setter, ref) => () => ref.current && ref.current.click();
  
  const handleFileChange = (setter) => async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Загружаем файл на сервер
        const uploadResult = await uploadImage(file);
        if (uploadResult && uploadResult.url) {
          setter(uploadResult.url);
        } else {
          throw new Error('Не удалось загрузить изображение');
        }
      } catch (err) {
        setError('Ошибка загрузки изображения: ' + err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = {
        full_name: fullName,
        email: email,
        phone: phone,
        birth_date: birthDate,
        passport_number: passportNumber,
        organization: organization,
        trusted_person_name: trustedPersonName,
        trusted_person_phone: trustedPersonPhone,
        passport_photo_front: frontPhoto,
        passport_photo_back: backPhoto,
        role: 'client',
        is_active: true,
        password: Math.random().toString(36).slice(-10), // временный пароль
        store_id: null, // будет установлен автоматически на сервере
        // сохраняем дополнительные документы в permissions как временное решение
        permissions: {
          client_photo: clientPhoto || null,
          driver_license_number: driverLicenseNumber || null,
          driver_license_front: driverFront || null,
          driver_license_back: driverBack || null,
          inn: inn || null,
        }
      };
      await addClient(data);
      setFullName(''); 
      setEmail(''); 
      setPhone('');
      setBirthDate(''); 
      setPassportNumber(''); 
      setOrganization('');
      setTrustedPersonName('');
      setTrustedPersonPhone('');
      setFrontPhoto(null); 
      setBackPhoto(null);
      onClientAdded && onClientAdded();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="add-client-modal modal-scrollable">
        <div className="modal-header-sticky">
          <button className="modal-close-btn" onClick={onClose}><FaTimes /></button>
          <h2 className="modal-title">Добавить клиента</h2>
        </div>
        <div className="add-client-modal-content">
          <form className="add-client-form" onSubmit={handleSubmit} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
            <input 
              className="modal-input" 
              type="text" 
              placeholder="ФИО" 
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              required 
            />
            <input 
              className="modal-input" 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <input 
              className="modal-input" 
              type="tel" 
              placeholder="+998 (99) 123 45 67" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              required 
            />
            <input 
              className="modal-input" 
              type="date" 
              value={birthDate} 
              onChange={e => setBirthDate(e.target.value)} 
              required 
            />
            <input 
              className="modal-input" 
              type="text" 
              placeholder="Номер паспорта (AE1234567891234)" 
              value={passportNumber} 
              onChange={e => setPassportNumber(e.target.value)} 
              required 
            />
            <input 
              className="modal-input" 
              type="text" 
              placeholder="Организация (необязательно)" 
              value={organization} 
              onChange={e => setOrganization(e.target.value)} 
            />
            <input 
              className="modal-input" 
              type="text" 
              placeholder="Доверенное лицо (обязательно)" 
              value={trustedPersonName} 
              onChange={e => setTrustedPersonName(e.target.value)} 
              required
            />
            <input 
              className="modal-input" 
              type="tel" 
              placeholder="Телефон доверенного лица (обязательно)" 
              value={trustedPersonPhone} 
              onChange={e => setTrustedPersonPhone(e.target.value)} 
              required
            />
            <div className="modal-label" style={{gridColumn:'1 / span 2'}}>Фото клиента (лицо)
              <div className="modal-photo-drop" onClick={handlePhoto(setClientPhoto, clientPhotoRef)}>
                <input type="file" accept="image/*" style={{display:'none'}} ref={clientPhotoRef} onChange={handleFileChange(setClientPhoto)} />
                {clientPhoto ? (
                  <img src={clientPhoto} alt="client" style={{maxWidth:'100%',maxHeight:80,borderRadius:6}} />
                ) : (
                  <>
                    <FaImage className="modal-photo-icon" />
                    <div className="modal-photo-text">Перетащите фото в эту область<br />либо нажмите на иконку</div>
                  </>
                )}
              </div>
            </div>
            <div className="modal-label">Фото паспорта (передняя сторона)
              <div className="modal-photo-drop" onClick={handlePhoto(setFrontPhoto, frontInputRef)}>
                <input type="file" accept="image/*" style={{display:'none'}} ref={frontInputRef} onChange={handleFileChange(setFrontPhoto)} />
                {frontPhoto ? (
                  <img src={frontPhoto} alt="front" style={{maxWidth:'100%',maxHeight:60,borderRadius:6}} />
                ) : (
                  <>
                    <FaImage className="modal-photo-icon" />
                    <div className="modal-photo-text">Перетащите фото в эту область<br />либо нажмите на иконку</div>
                  </>
                )}
              </div>
            </div>
            <div className="modal-label">Фото паспорта (задняя сторона)
              <div className="modal-photo-drop" onClick={handlePhoto(setBackPhoto, backInputRef)}>
                <input type="file" accept="image/*" style={{display:'none'}} ref={backInputRef} onChange={handleFileChange(setBackPhoto)} />
                {backPhoto ? (
                  <img src={backPhoto} alt="back" style={{maxWidth:'100%',maxHeight:60,borderRadius:6}} />
                ) : (
                  <>
                    <FaImage className="modal-photo-icon" />
                    <div className="modal-photo-text">Перетащите фото в эту область<br />либо нажмите на иконку</div>
                  </>
                )}
              </div>
            </div>
            <input 
              className="modal-input" 
              type="text" 
              placeholder="Номер водительского удостоверения (необязательно)" 
              value={driverLicenseNumber} 
              onChange={e => setDriverLicenseNumber(e.target.value)} 
              style={{gridColumn:'1 / span 2'}}
            />
            <div className="modal-label">Фото ВУ (лицевая)
              <div className="modal-photo-drop" onClick={handlePhoto(setDriverFront, driverFrontRef)}>
                <input type="file" accept="image/*" style={{display:'none'}} ref={driverFrontRef} onChange={handleFileChange(setDriverFront)} />
                {driverFront ? (
                  <img src={driverFront} alt="driver-front" style={{maxWidth:'100%',maxHeight:60,borderRadius:6}} />
                ) : (
                  <>
                    <FaImage className="modal-photo-icon" />
                    <div className="modal-photo-text">Перетащите фото в эту область<br />либо нажмите на иконку</div>
                  </>
                )}
              </div>
            </div>
            <div className="modal-label">Фото ВУ (оборот)
              <div className="modal-photo-drop" onClick={handlePhoto(setDriverBack, driverBackRef)}>
                <input type="file" accept="image/*" style={{display:'none'}} ref={driverBackRef} onChange={handleFileChange(setDriverBack)} />
                {driverBack ? (
                  <img src={driverBack} alt="driver-back" style={{maxWidth:'100%',maxHeight:60,borderRadius:6}} />
                ) : (
                  <>
                    <FaImage className="modal-photo-icon" />
                    <div className="modal-photo-text">Перетащите фото в эту область<br />либо нажмите на иконку</div>
                  </>
                )}
              </div>
            </div>
            <input 
              className="modal-input" 
              type="text" 
              placeholder="ИНН (необязательно)" 
              value={inn} 
              onChange={e => setInn(e.target.value)} 
              style={{gridColumn:'1 / span 2'}}
            />
            <div className="modal-step-row" style={{gridColumn:'1 / span 2'}}>
              <div className="modal-step">1/2</div>
            </div>
            <button className="modal-submit-btn" type="submit" disabled={loading} style={{gridColumn:'1 / span 2'}}>{loading ? 'Добавление...' : 'Далее'}</button>
            {error && <div style={{color:'red',marginTop:8, gridColumn:'1 / span 2'}}>{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}

const ClientsPage = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState('');
  const clientsPerPage = 10;
  const normalized = (s) => (s || '').toString().toLowerCase().trim();
  const filtered = clients.filter(c => {
    const q = normalized(query);
    if (!q) return true;
    return (
      normalized(c.full_name).includes(q) ||
      normalized(c.phone).includes(q) ||
      normalized(c.passport_number).includes(q)
    );
  });
  const clientsToShow = filtered.slice((currentPage - 1) * clientsPerPage, currentPage * clientsPerPage);
  const totalPages = Math.ceil(filtered.length / clientsPerPage);

  const reloadClients = () => {
    setLoading(true);
    fetchClients()
      .then(setClients)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reloadClients();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [modalOpen]);

  return (
    <div className="clients-page">
      <div className="clients-header">
        <h1 className="clients-title">Клиенты <span className="clients-count">({clients.length})</span></h1>
        <div className="clients-controls">
          <div className="clients-search">
            <span className="search-icon"><FaSearch /></span>
            <input
              type="text"
              placeholder="Поиск по ФИО, телефону, паспорту"
              value={query}
              onChange={(e)=>{ setQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <button className="clients-filter" onClick={() => setFilterOpen(v => !v)}><FaFilter /></button>
            {filterOpen && (
              <div className="filter-dropdown">
                <label><input type="checkbox" /> Активные</label>
                <label><input type="checkbox" /> Неактивные</label>
                <div className="filter-more">
                  Ещё <span style={{ color: '#397DFF', fontSize: 18, marginLeft: 4 }}>^</span>
                </div>
              </div>
            )}
          </div>
          <button className="add-client-btn" onClick={() => setModalOpen(true)}>
            <FaPlus />
            <span className="add-client-text">Добавить клиент</span>
          </button>
        </div>
      </div>
      <div className="clients-table-wrapper">
        {loading ? (
          <div>Загрузка...</div>
        ) : error ? (
          <div style={{color:'red'}}>Ошибка: {error}</div>
        ) : (
          <table className="clients-table">
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Email</th>
                <th>Телефон</th>
                <th>Организация</th>
                <th>Дата рождения</th>
                <th>Паспорт</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {clientsToShow.map((client) => (
                <tr
                  key={client.id}
                  className="clients-row-hover"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <td>{client.full_name || '-'}</td>
                  <td>{client.email || '-'}</td>
                  <td>{client.phone || '-'}</td>
                  <td>{client.organization || '-'}</td>
                  <td>{client.birth_date ? new Date(client.birth_date).toLocaleDateString('ru-RU') : '-'}</td>
                  <td>{client.passport_number || '-'}</td>
                  <td>
                    <span className={`client-status-badge ${client.is_active ? 'active' : 'inactive'}`}>{client.is_active ? 'Активен' : 'Неактивен'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="clients-table-footer">
          <span className="clients-table-entries">Показаны {clientsToShow.length ? ((currentPage-1)*clientsPerPage+1) : 0}–{(currentPage-1)*clientsPerPage+clientsToShow.length} из {clients.length} клиентов</span>
          <div className="clients-table-pagination">
            <button className="page-btn" disabled={currentPage===1} onClick={()=>setCurrentPage(currentPage-1)}>{'<'}</button>
            {Array.from({length: totalPages}, (_,i)=>i+1).slice(0,4).map(page => (
              <button key={page} className={`page-btn${currentPage===page?' active':''}`} onClick={()=>setCurrentPage(page)}>{page}</button>
            ))}
            {totalPages > 5 && <span className="page-dots">...</span>}
            {totalPages > 4 && <button className={`page-btn${currentPage===totalPages?' active':''}`} onClick={()=>setCurrentPage(totalPages)}>{totalPages}</button>}
            <button className="page-btn" disabled={currentPage===totalPages} onClick={()=>setCurrentPage(currentPage+1)}>{'>'}</button>
          </div>
        </div>
      </div>
      <AddClientModal open={modalOpen} onClose={() => setModalOpen(false)} onClientAdded={reloadClients} />
    </div>
  );
};

export default ClientsPage; 