import React, { useEffect, useState } from 'react';
import './ClientInfoPage.css';
import { FaChevronLeft, FaEdit, FaTrash, FaUserCircle, FaSave, FaTimes, FaEye, FaBox } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchClientById, updateClient, deleteClient } from '../api/clients';
import { fetchClientComments, addClientComment, deleteClientComment } from '../api/clientComments';
import ImageModal from '../components/ImageModal';
import { fetchRentals } from '../api/rental';
import { fetchEquipmentItem } from '../api/equipment';

const statusClass = {
  true: 'status-green',
  false: 'status-red',
};

const ClientInfoPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentDeleteId, setCommentDeleteId] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [imagePreview, setImagePreview] = useState({ open: false, src: '', alt: '' });
  const [clientRentals, setClientRentals] = useState([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  const [rentalsError, setRentalsError] = useState('');
  const [detailRental, setDetailRental] = useState(null);
  const [equipmentNameMap, setEquipmentNameMap] = useState({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchClientById(id)
      .then(data => {
        setClient(data);
        setEditData(data);
      })
      .catch(e => {
        console.error('Error fetching client:', e);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Когда открываем модал с арендой — подгружаем названия техники
  useEffect(() => {
    const loadNames = async () => {
      if (!detailRental || !detailRental.items || detailRental.items.length === 0) return;
      const ids = Array.from(new Set(detailRental.items.map(i => i.equipment_id)));
      const map = {};
      await Promise.all(ids.map(async eid => {
        try {
          const eq = await fetchEquipmentItem(eid);
          map[eid] = eq.title || `ID ${eid}`;
        } catch {
          map[eid] = `ID ${eid}`;
        }
      }));
      setEquipmentNameMap(map);
    };
    loadNames();
  }, [detailRental]);

  useEffect(() => {
    setCommentsLoading(true);
    fetchClientComments(id)
      .then(setComments)
      .catch(e => setCommentError(e.message))
      .finally(() => setCommentsLoading(false));
  }, [id]);

  useEffect(() => {
    const loadRentals = async () => {
      try {
        setRentalsLoading(true);
        const all = await fetchRentals(0, 1000);
        setClientRentals(all.filter(r => String(r.client_id) === String(id)));
      } catch (e) {
        setRentalsError(e.message || 'Ошибка загрузки');
      } finally {
        setRentalsLoading(false);
      }
    };
    loadRentals();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().slice(0, 10);
    } catch (e) {
      return dateString;
    }
  };

  const formatDateHuman = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatDateTimeHuman = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const parseDiscount = (comment) => {
    if (!comment) return { discountType: null, discountValue: 0 };
    const m = /Скидка:\s*(\d+)\s*(%|сум)/i.exec(comment);
    if (!m) return { discountType: null, discountValue: 0 };
    const value = Number(m[1] || 0);
    const type = m[2] === '%' ? 'percent' : 'amount';
    return { discountType: type, discountValue: value };
  };

  const computeDiscounted = (total, discount) => {
    if (!discount.discountType) return total || 0;
    if (discount.discountType === 'percent') {
      return Math.max(0, (total || 0) * (1 - (discount.discountValue || 0) / 100));
    }
    return Math.max(0, (total || 0) - (discount.discountValue || 0));
  };

  const getStatusText = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'active': return 'Аренда';
      case 'booked': return 'Бронь';
      case 'completed': return 'Завершена';
      case 'cancelled': return 'Отменена';
      case 'overdue': return 'Просрочена';
      default: return status;
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const toSend = { ...editData };
      if (toSend.birth_date) {
        toSend.birth_date = formatDate(toSend.birth_date);
      }
      const updated = await updateClient(client.id, toSend);
      setClient(updated);
      setIsEditing(false);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteClient(client.id);
      setShowDeleteModal(false);
      navigate('/clients');
    } catch (e) {
      setDeleteError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const newComment = await addClientComment(id, commentText);
      setComments([newComment, ...comments]);
      setCommentText('');
    } catch (e) {
      setCommentError(e.message);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    setCommentDeleteId(commentId);
    try {
      await deleteClientComment(id, commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (e) {
      setCommentError(e.message);
    } finally {
      setCommentDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="client-info-page">
        <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' }}>
          Загрузка информации о клиенте...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-info-page">
        <div style={{ textAlign: 'center', padding: '50px', color: '#ff3b30' }}>
          <h3>Ошибка загрузки данных</h3>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/clients')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#397DFF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Вернуться к списку клиентов
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="client-info-page">
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          <h3>Клиент не найден</h3>
          <button 
            onClick={() => navigate('/clients')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#397DFF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Вернуться к списку клиентов
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="client-info-page">
      <div className="back-row" onClick={() => navigate('/clients')}>
        <button className="back-icon-btn"><FaChevronLeft /></button>
        <span className="back-text">Назад к списку клиентов</span>
      </div>
      <div className="client-info-card">
        <div className="client-info-header">
          <div className="client-avatar-wrap">
            {client.permissions?.client_photo ? (
              <img
                src={client.permissions.client_photo}
                alt="Фото клиента"
                className="client-avatar"
                style={{ cursor: 'zoom-in' }}
                onClick={() => setImagePreview({ open: true, src: client.permissions.client_photo, alt: client.full_name || 'Фото клиента' })}
                onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
              />
            ) : (
              <FaUserCircle className="client-avatar-icon" />
            )}
          </div>
          <div className="client-info-main">
            <h2 className="client-info-name">{client.full_name || client.email || 'Клиент'}</h2>
            {client.is_verified && (
              <div className="client-status-row">
                <span className={`status-dot ${statusClass[client.is_verified]}`} />
                <span className="status-text">Верифицирован</span>
              </div>
            )}
          </div>
          <div className="client-info-actions">
            {!isEditing ? (
              <>
                <button className="edit-btn" onClick={() => setIsEditing(true)}><FaEdit /> Редактировать</button>
                <button className="edit-btn" style={{ background: '#ff3b30' }} onClick={() => setShowDeleteModal(true)}><FaTrash /> Удалить</button>
              </>
            ) : (
              <>
                <button className="edit-btn" onClick={handleSave} disabled={saving}><FaSave /> {saving ? 'Сохранение...' : 'Сохранить'}</button>
                <button className="edit-btn" style={{ background: '#b0b8c9', color: '#222' }} onClick={() => { setIsEditing(false); setEditData(client); }}><FaTimes /> Отмена</button>
              </>
            )}
          </div>
        </div>
        <div className="client-info-fields">
          <div className="client-info-field">
            <label>Email</label>
            {isEditing ? (
              <input name="email" value={editData.email || ''} onChange={handleEditChange} />
            ) : (
              <input value={client.email || '-'} readOnly />
            )}
          </div>
          <div className="client-info-field">
            <label>Телефон</label>
            {isEditing ? (
              <input name="phone" value={editData.phone || ''} onChange={handleEditChange} />
            ) : (
              <input value={client.phone || '-'} readOnly />
            )}
          </div>
          <div className="client-info-field">
            <label>Дата рождения</label>
            {isEditing ? (
              <input name="birth_date" type="date" value={formatDate(editData.birth_date)} onChange={handleEditChange} />
            ) : (
              <input value={formatDate(client.birth_date) || '-'} readOnly />
            )}
          </div>
          <div className="client-info-field">
            <label>Номер паспорта</label>
            {isEditing ? (
              <input name="passport_number" value={editData.passport_number || ''} onChange={handleEditChange} />
            ) : (
              <input value={client.passport_number || '-'} readOnly />
            )}
          </div>
          <div className="client-info-field">
            <label>Организация</label>
            {isEditing ? (
              <input name="organization" value={editData.organization || ''} onChange={handleEditChange} />
            ) : (
              <input value={client.organization || '-'} readOnly />
            )}
          </div>
          <div className="client-info-field">
            <label>Доверенное лицо</label>
            {isEditing ? (
              <input name="trusted_person_name" value={editData.trusted_person_name || ''} onChange={handleEditChange} />
            ) : (
              <input value={client.trusted_person_name || '-'} readOnly />
            )}
          </div>
          <div className="client-info-field">
            <label>Телефон доверенного лица</label>
            {isEditing ? (
              <input name="trusted_person_phone" value={editData.trusted_person_phone || ''} onChange={handleEditChange} />
            ) : (
              <input value={client.trusted_person_phone || '-'} readOnly />
            )}
          </div>
        </div>
        {saveError && <div style={{color:'red',marginTop:8}}>{saveError}</div>}
        {/* Фото паспорта */}
        {(client.passport_photo_front || client.passport_photo_back) && (
          <div className="client-info-history-block">
            <h3 className="client-info-history-title">Фото паспорта</h3>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {client.passport_photo_front && (
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ marginBottom: '10px', color: '#666' }}>Передняя сторона</h4>
                  <img 
                    src={client.passport_photo_front} 
                    alt="Паспорт (передняя сторона)" 
                    style={{ 
                      maxWidth: '300px', 
                      maxHeight: '200px', 
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      cursor: 'zoom-in'
                    }}
                    onClick={() => setImagePreview({ open: true, src: client.passport_photo_front, alt: 'Паспорт (передняя сторона)' })}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none', color: '#999', padding: '20px' }}>
                    Ошибка загрузки изображения
                  </div>
                </div>
              )}
              {client.passport_photo_back && (
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ marginBottom: '10px', color: '#666' }}>Задняя сторона</h4>
                  <img 
                    src={client.passport_photo_back} 
                    alt="Паспорт (задняя сторона)" 
                    style={{ 
                      maxWidth: '300px', 
                      maxHeight: '200px', 
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      cursor: 'zoom-in'
                    }}
                    onClick={() => setImagePreview({ open: true, src: client.passport_photo_back, alt: 'Паспорт (задняя сторона)' })}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none', color: '#999', padding: '20px' }}>
                    Ошибка загрузки изображения
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Дополнительные документы */}
        {(client.permissions?.driver_license_number || client.permissions?.driver_license_front || client.permissions?.driver_license_back || client.permissions?.inn) && (
          <div className="client-info-history-block">
            <h3 className="client-info-history-title">Дополнительные документы</h3>
            <div className="client-docs-grid">
              {client.permissions?.inn && (
                <div className="client-doc-item">
                  <h4 className="client-doc-title">ИНН</h4>
                  <div className="client-doc-value">{client.permissions.inn}</div>
                </div>
              )}
              {client.permissions?.driver_license_number && (
                <div className="client-doc-item">
                  <h4 className="client-doc-title">Номер водительского удостоверения</h4>
                  <div className="client-doc-value">{client.permissions.driver_license_number}</div>
                </div>
              )}
              {client.permissions?.driver_license_front && (
                <div className="client-doc-photo">
                  <h4 className="client-doc-title">Водительское удостоверение (лицевая сторона)</h4>
                  <img 
                    src={client.permissions.driver_license_front} 
                    alt="Водительское удостоверение (лицевая сторона)" 
                    className="client-doc-image"
                    style={{ cursor: 'zoom-in' }}
                    onClick={() => setImagePreview({ open: true, src: client.permissions.driver_license_front, alt: 'Водительское удостоверение (лицевая сторона)' })}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none', color: '#999', padding: '20px', textAlign: 'center' }}>
                    Ошибка загрузки изображения
                  </div>
                </div>
              )}
              {client.permissions?.driver_license_back && (
                <div className="client-doc-photo">
                  <h4 className="client-doc-title">Водительское удостоверение (оборотная сторона)</h4>
                  <img 
                    src={client.permissions.driver_license_back} 
                    alt="Водительское удостоверение (оборотная сторона)" 
                    className="client-doc-image"
                    style={{ cursor: 'zoom-in' }}
                    onClick={() => setImagePreview({ open: true, src: client.permissions.driver_license_back, alt: 'Водительское удостоверение (оборотная сторона)' })}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none', color: '#999', padding: '20px', textAlign: 'center' }}>
                    Ошибка загрузки изображения
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Блок комментариев */}
        <div className="client-comments-block">
          <h3 className="client-info-history-title">Комментарии</h3>
          <form className="client-comment-form" onSubmit={handleAddComment}>
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Оставьте комментарий..."
              rows={2}
              disabled={commentSubmitting}
            />
            <button type="submit" className="edit-btn" style={{marginTop:8}} disabled={commentSubmitting || !commentText.trim()}>
              {commentSubmitting ? 'Сохранение...' : 'Добавить'}
            </button>
          </form>
          {commentError && <div style={{color:'red',margin:'8px 0'}}>{commentError}</div>}
          {commentsLoading ? (
            <div style={{color:'#888',margin:'12px 0'}}>Загрузка комментариев...</div>
          ) : (
            <div className="client-comments-list">
              {comments.length === 0 && <div style={{color:'#888'}}>Комментариев пока нет.</div>}
              {comments.map(comment => (
                <div className="client-comment-item" key={comment.id}>
                  <div className="client-comment-header">
                    <span className="client-comment-author">
                      {comment.author_id === user?.id
                        ? 'Вы'
                        : comment.author_full_name || `Пользователь #${comment.author_id}`}
                    </span>
                    <span className="client-comment-date">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                    {comment.author_id === user?.id && (
                      <button
                        className="client-comment-delete-btn"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={commentDeleteId === comment.id}
                        title="Удалить комментарий"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                  <div className="client-comment-text">{comment.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* История аренд клиента */}
      <div className="client-info-history-block">
        <h3 className="client-info-history-title">История аренды</h3>
        {rentalsLoading ? (
          <div style={{padding:20}}>Загрузка...</div>
        ) : rentalsError ? (
          <div style={{color:'red',padding:20}}>{rentalsError}</div>
        ) : clientRentals.length === 0 ? (
          <div style={{padding:20,color:'#666'}}>У клиента нет аренд</div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Начало</th>
                  <th>Окончание</th>
                  <th>Админ</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clientRentals.map(r => (
                  <tr key={r.id}>
                    <td>{formatDateHuman(r.date_start)}</td>
                    <td>{formatDateHuman(r.date_end)}</td>
                    <td>{r.admin_full_name || 'Админ'}</td>
                    <td>{(r.total_amount||0).toLocaleString()} сум</td>
                    <td>{getStatusText(r.status)}</td>
                    <td>
                      <button className="history-detail-btn" title="Подробнее" onClick={()=>setDetailRental(r)}>
                        <FaEye color="#397DFF" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailRental && (
        <div className="modal-backdrop" onClick={()=>setDetailRental(null)}>
          <div className="accept-modal" onClick={e=>e.stopPropagation()}>
            <div className="accept-modal-header">
              <h3>Аренда #{detailRental.id}</h3>
              <button className="close-btn" onClick={()=>setDetailRental(null)}>×</button>
            </div>
            <div className="accept-modal-body">
              <div className="summary-grid">
                <div className="summary-item"><span className="label">Начало</span><span className="value">{formatDateTimeHuman(detailRental.date_start)}</span></div>
                <div className="summary-item"><span className="label">Окончание</span><span className="value">{formatDateTimeHuman(detailRental.date_end)}</span></div>
                <div className="summary-item"><span className="label">Админ</span><span className="value">{detailRental.admin_full_name || 'Админ'}</span></div>
                <div className="summary-item"><span className="label">Статус</span><span className="value">{getStatusText(detailRental.status)}</span></div>
                <div className="summary-item"><span className="label">Сумма</span><span className="value">{(detailRental.total_amount||0).toLocaleString()} сум</span></div>
                {(() => { const m=/Скидка:\s*(\d+)\s*(%|сум)/i.exec(detailRental.comment||''); if(!m) return null; const val=Number(m[1]||0); const isPct=m[2]==='%'; const withDisc = isPct? Math.max(0,(detailRental.total_amount||0)*(1-val/100)) : Math.max(0,(detailRental.total_amount||0)-val); return (<div className="summary-item"><span className="label">Со скидкой</span><span className="value">{withDisc.toLocaleString()} сум</span></div>); })()}
              </div>
              <div style={{marginTop:12}}>
                <h4 style={{margin:'10px 0'}}>Техники</h4>
                {(detailRental.items||[]).map(it => (
                  <div key={it.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f0f2f7'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}><FaBox/> {equipmentNameMap[it.equipment_id] || `ID ${it.equipment_id}`}</div>
                    <div>{it.quantity} шт.</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="delete-modal">
            <h3>Вы действительно хотите удалить этого пользователя?</h3>
            {deleteError && <div style={{color:'red',margin:'10px 0'}}>{deleteError}</div>}
            <div style={{display:'flex',gap:16,justifyContent:'center',marginTop:24}}>
              <button className="edit-btn" style={{background:'#ff3b30',minWidth:120}} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
              <button className="edit-btn" style={{background:'#b0b8c9',color:'#222',minWidth:120}} onClick={()=>setShowDeleteModal(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
      <ImageModal
        isOpen={imagePreview.open}
        src={imagePreview.src}
        alt={imagePreview.alt}
        onClose={() => setImagePreview({ open: false, src: '', alt: '' })}
      />
    </div>
  );
};

export default ClientInfoPage; 