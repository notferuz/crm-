import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaEye } from 'react-icons/fa';
import { fetchRentals, deleteRental } from '../api/rental';
import './HistoryPage.css';
import Modal from '../components/Modal/Modal';

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function getStatusText(status) {
  switch (status) {
    case 'active': return 'Аренда';
    case 'booked': return 'Бронь';
    case 'completed': return 'Завершена';
    case 'cancelled': return 'Отменена';
    case 'overdue': return 'Просрочена';
    default: return status;
  }
}

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all'); // all | active | booked | completed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchRentals(0, 1000); // получаем все
      setHistory(data);
    } catch (e) {
      setError(e.message || 'Ошибка загрузки истории');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeletingId(deleteTargetId);
    try {
      await deleteRental(deleteTargetId);
      setHistory(h => h.filter(r => r.id !== deleteTargetId));
    } catch (e) {
      alert('Ошибка удаления: ' + (e.message || ''));
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    }
  };

  const filtered = history.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="history-page">
      <h1>История аренд и бронирований</h1>
      <div className="history-filters">
        <button className={`hf-btn ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>Все</button>
        <button className={`hf-btn ${filter==='active'?'active':''}`} onClick={()=>setFilter('active')}>Активные</button>
        <button className={`hf-btn ${filter==='booked'?'active':''}`} onClick={()=>setFilter('booked')}>Бронь</button>
        <button className={`hf-btn ${filter==='completed'?'active':''}`} onClick={()=>setFilter('completed')}>Завершена</button>
      </div>
      {loading ? (
        <div style={{padding: 30, textAlign: 'center'}}>Загрузка...</div>
      ) : error ? (
        <div style={{color: 'red', padding: 30}}>{error}</div>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Клиент</th>
              <th>Дата начала</th>
              <th>Дата окончания</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Админ</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{textAlign:'center',padding:20}}>Нет данных</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id}>
                <td>
                  <span className="history-client-link" onClick={() => navigate(`/clients/${r.client_id}`)} style={{cursor:'pointer',color:'#397DFF',textDecoration:'underline'}}>
                    {r.client_full_name || r.client_email || r.client_phone || 'Клиент'}
                  </span>
                </td>
                <td>{formatDate(r.date_start)}</td>
                <td>{formatDate(r.date_end)}</td>
                <td>{r.total_amount?.toLocaleString() || 0} сум</td>
                <td>{getStatusText(r.status)}</td>
                <td>{r.admin_full_name || 'Админ'}</td>
                <td>
                  <button className="history-delete-btn" onClick={() => handleDelete(r.id)} disabled={deletingId===r.id} title="Удалить">
                    <FaTrash color="#ff3b30" />
                  </button>
                </td>
                <td>
                  <button className="history-detail-btn" onClick={() => navigate(`/rental/${r.id}`)} title="Подробнее">
                    <FaEye color="#397DFF" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Modal
        show={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteTargetId(null); }}
        onConfirm={confirmDelete}
        title="Подтверждение удаления"
        message="Вы уверены, что хотите удалить эту аренду/бронь? Это действие необратимо."
        confirmText="Удалить"
        cancelText="Отмена"
      />
    </div>
  );
};

export default HistoryPage; 