import React, { useEffect, useMemo, useState } from 'react';
import { FaCalendarCheck, FaClock, FaMoneyBillWave, FaBoxOpen, FaUser, FaExclamationTriangle, FaTools, FaCheckCircle, FaCreditCard, FaWallet } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { fetchRentals, returnRental } from '../api/rental';
import { fetchEquipmentItem } from '../api/equipment';
import './AcceptPage.css';

const daysUntil = (dateStr) => {
  if (!dateStr) return 0;
  const today = new Date();
  const end = new Date(dateStr);
  const diff = Math.ceil((end - new Date(today.toDateString())) / (1000*60*60*24));
  return diff;
};

const AcceptPage = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [equipmentMap, setEquipmentMap] = useState({});
  const [toast, setToast] = useState('');
  const navigate = useNavigate();
  const [payCash, setPayCash] = useState(0);
  const [payCard, setPayCard] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState('amount'); // amount | percent

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchRentals(0, 500);
        setRentals(data.filter(r => r.status === 'active' || r.status === 'overdue'));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const groups = useMemo(() => {
    const map = { due_1: [], due_2_5: [], overdue: [] };
    for (const r of rentals) {
      const d = daysUntil(r.date_end);
      if (r.status === 'overdue' || d < 0) map.overdue.push(r);
      else if (d <= 1) map.due_1.push(r);
      else map.due_2_5.push(r);
    }
    return map;
  }, [rentals]);

  const handleOpen = (r) => {
    // enrich items with UI state for partial acceptance (frontend only for now)
    const itemsWithUi = (r.items || []).map(it => ({
      ...it,
      ui_selected: true,
      ui_accepted_qty: it.quantity
    }));
    setSelected({ ...r, items: itemsWithUi });
    setPayCash(0);
    setPayCard(0);
    setDiscountValue(0);
    setDiscountType('amount');
  };
  
  useEffect(() => {
    const loadNames = async () => {
      if (!selected || !selected.items || selected.items.length === 0) return;
      const ids = Array.from(new Set(selected.items.map(i => i.equipment_id)));
      const map = {};
      await Promise.all(ids.map(async (eid) => {
        try {
          const eq = await fetchEquipmentItem(eid);
          map[eid] = eq.title || `ID ${eid}`;
        } catch {
          map[eid] = `ID ${eid}`;
        }
      }));
      setEquipmentMap(map);
    };
    loadNames();
  }, [selected]);
  const handleClose = () => setSelected(null);

  const handleAcceptAll = async () => {
    if (!selected) return;
    try {
      await returnRental(selected.id, { cash: payCash, card: payCard });
      setRentals(prev => prev.filter(r => r.id !== selected.id));
      handleClose();
      setToast(`Аренда #${selected.id} закрыта`);
      setTimeout(() => setToast(''), 2500);
    } catch (e) {
      alert(e.message || 'Ошибка при принятии');
    }
  };

  if (loading) return <div className="accept-page"><div className="accept-loading">Загрузка...</div></div>;
  if (error) return <div className="accept-page"><div className="accept-error">{error}</div></div>;

  const formatDaysLeft = (dateStr) => {
    const d = daysUntil(dateStr);
    if (d < 0) return `просрочено на ${Math.abs(d)} д.`;
    if (d === 0) return 'сдать сегодня';
    if (d === 1) return 'остался 1 день';
    return `осталось ${d} дней`;
  };

  const ruDate = (dateStr) => new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
  const fullRuDate = (dateStr) => new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  const daysBetween = (startStr, endStr) => {
    if (!startStr || !endStr) return 0;
    const start = new Date(new Date(startStr).toDateString());
    const end = new Date(new Date(endStr).toDateString());
    return Math.max(0, Math.ceil((end - start) / (1000*60*60*24)));
  };
  const clampNumber = (val, min, max) => Math.max(min, Math.min(max, val));
  const formatSum = (n) => (Math.round(n || 0)).toLocaleString();
  const unformatNumber = (str) => Number(String(str || '').replace(/\s+/g, '')) || 0;
  const formatInput = (n) => {
    const num = Number(n || 0);
    if (Number.isNaN(num)) return '';
    return num.toLocaleString('ru-RU');
  };

  const originalTotal = selected?.total_amount || 0;
  const discountedTotal = (() => {
    if (!selected) return 0;
    if (discountType === 'percent') {
      const pct = clampNumber(discountValue, 0, 100);
      return Math.max(0, originalTotal * (1 - pct / 100));
    }
    const amt = clampNumber(discountValue, 0, originalTotal);
    return Math.max(0, originalTotal - amt);
  })();
  const totalDue = discountedTotal;

  const Section = ({ title, items }) => (
    items.length > 0 && (
      <div className="accept-section">
        <div className="accept-section-header">
        <h3>{title}</h3>
          <span className="accept-section-count">{items.length}</span>
        </div>
        <div className="accept-list">
          {items.map(r => (
            <div className="accept-card" key={r.id} onClick={() => handleOpen(r)}>
              <div className="accept-card-row">
                <div className={`status-badge ${r.status}`}>{r.status === 'overdue' ? 'Просрочено' : 'Активна'}</div>
                <div className="accept-id">#{r.id}</div>
              </div>
              <div className="accept-card-row">
                <div className="accept-client" onClick={(e) => { e.stopPropagation(); if (r.client_id) navigate(`/clients/${r.client_id}`); }} title="Открыть профиль клиента">
                  <FaUser className="accept-client-icon" />
                  <span className="accept-client-name">{r.client_full_name || r.client_email || 'Клиент'}</span>
                </div>
                <div className="accept-dates"><FaClock/> до {new Date(r.date_end).toLocaleDateString('ru-RU')} • {formatDaysLeft(r.date_end)}</div>
              </div>
              <div className="accept-card-row">
                <div className="accept-items"><FaBoxOpen/> позиций: {r.items?.length || 0}</div>
                <div className="accept-total"><FaMoneyBillWave/> {(r.total_amount||0).toLocaleString()} сум</div>
              </div>
              {r.status === 'overdue' && (
                <div className="accept-card-warning"><FaExclamationTriangle/> Есть просрочка</div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  );

  return (
    <div className="accept-page">
      <h1 className="accept-title"><FaCalendarCheck/> Принять технику</h1>
      {toast && <div className="accept-toast">{toast}</div>}
      {groups.due_1.length === 0 && groups.due_2_5.length === 0 && groups.overdue.length === 0 && (
        <div className="accept-empty">Пока нету</div>
      )}
      <Section title="Сдать завтра (≤ 1 день)" items={groups.due_1} />
      <Section title="Сдать через 2-5 дней" items={groups.due_2_5} />
      <Section title="Просроченные" items={groups.overdue} />

      {selected && (
        <div className="modal-backdrop" onClick={handleClose}>
          <div className="accept-modal" onClick={(e) => e.stopPropagation()}>
            <div className="accept-modal-header">
              <div className="accept-modal-title"><FaCheckCircle className="accept-modal-title-icon" /> <h3>Принять аренду #{selected.id}</h3></div>
              <button className="close-btn" onClick={handleClose}>×</button>
            </div>
            <div className="accept-modal-body">
              <div className="accept-modal-block">
                <h4><FaTools style={{marginRight:6}}/> Техника</h4>
                <div className="accept-modal-items">
                  {(selected.items||[]).map(it => (
                    <div key={it.id} className="accept-item-row">
                      <label className="accept-item-check">
                        <input
                          type="checkbox"
                          checked={!!it.ui_selected}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelected(prev => ({
                              ...prev,
                              items: prev.items.map(x => x.id === it.id ? { ...x, ui_selected: checked } : x)
                            }));
                          }}
                        />
                      </label>
                      <div className="accept-item-title"><FaTools className="accept-item-icon"/> {equipmentMap[it.equipment_id] || `ID ${it.equipment_id}`}</div>
                      <div className="accept-item-qty"><span className="label">Выдано</span><span className="value">{it.quantity}</span></div>
                      <div className="accept-item-qty input">
                        <span className="label">Принято</span>
                        <input
                          type="number"
                          min={0}
                          max={it.quantity}
                          value={it.ui_accepted_qty}
                          disabled={!it.ui_selected}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(Number(e.target.value || 0), it.quantity));
                            setSelected(prev => ({
                              ...prev,
                              items: prev.items.map(x => x.id === it.id ? { ...x, ui_accepted_qty: val } : x)
                            }));
                          }}
                        />
                      </div>
                      <div className="accept-item-qty"><span className="label">Долг</span><span className={`badge-debt ${Math.max(0, (it.quantity || 0) - (it.ui_accepted_qty || 0))>0?'show':''}`}>{Math.max(0, (it.quantity || 0) - (it.ui_accepted_qty || 0))}</span></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="accept-modal-block">
                <h4><FaMoneyBillWave style={{marginRight:6}}/> Оплата</h4>
                <div className="accept-payment-grid">
                  <div className="input-group">
                    <label><FaWallet className="input-icon"/> Наличные</label>
                    <input
                      className="ui-input"
                      type="text"
                      min={0}
                      value={formatInput(payCash)}
                      onChange={(e)=>{
                        const val = unformatNumber(e.target.value);
                        const clamped = clampNumber(val, 0, totalDue);
                        setPayCash(clamped);
                        setPayCard(clampNumber(totalDue - clamped, 0, totalDue));
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div className="input-group">
                    <label><FaCreditCard className="input-icon"/> Карта</label>
                    <input
                      className="ui-input"
                      type="text"
                      min={0}
                      value={formatInput(payCard)}
                      onChange={(e)=>{
                        const val = unformatNumber(e.target.value);
                        const clamped = clampNumber(val, 0, totalDue);
                        setPayCard(clamped);
                        setPayCash(clampNumber(totalDue - clamped, 0, totalDue));
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="accept-modal-block">
                <h4>Скидка</h4>
                <div className="discount-grid">
                  <select className="ui-select" value={discountType} onChange={(e)=>setDiscountType(e.target.value)}>
                    <option value="amount">Сумма (сум)</option>
                    <option value="percent">Процент (%)</option>
                  </select>
                  <input
                    className="ui-input"
                    type="text"
                    min={0}
                    max={discountType==='percent'?100:undefined}
                    value={discountType==='percent' ? String(discountValue) : formatInput(discountValue)}
                    onChange={(e)=>{
                      if (discountType === 'percent') {
                        const val = unformatNumber(e.target.value);
                        setDiscountValue(clampNumber(val, 0, 100));
                      } else {
                        const val = unformatNumber(e.target.value);
                        setDiscountValue(clampNumber(val, 0, originalTotal));
                      }
                    }}
                    placeholder={discountType==='percent'?"0":"0"}
                  />
                </div>
              </div>

              <div className="accept-modal-block">
                <h4>Сводка</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="label">Взял</span>
                    <span className="value">{fullRuDate(selected.date_start)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Вернуть до</span>
                    <span className="value">{fullRuDate(selected.date_end)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Дней аренды</span>
                    <span className="value">{daysBetween(selected.date_start, selected.date_end)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Изначально</span>
                    <span className="value">{formatSum(originalTotal)} сум</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Со скидкой</span>
                    <span className="value">{formatSum(discountedTotal)} сум</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Админ</span>
                    <span className="value">{selected.admin_full_name || 'Админ'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="accept-modal-footer">
              <div className="accept-deadline-info"><FaClock style={{marginRight:6}}/> Срок: до {ruDate(selected.date_end)} • {formatDaysLeft(selected.date_end)}</div>
              <div className="accept-modal-actions">
                <button className="accept-cancel" onClick={handleClose}>Отмена</button>
                <button className="accept-confirm" title="Пока доступен только полный прием" onClick={handleAcceptAll}><FaCheckCircle style={{marginRight:6}}/> Принять всё</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcceptPage;


