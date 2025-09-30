import React, { useState, useEffect } from 'react';
import { FaSearch, FaUser, FaBox, FaCalendarAlt, FaMoneyBillWave, FaCheck, FaArrowRight, FaArrowLeft, FaPlus, FaMinus, FaTruck, FaPercent, FaExternalLinkAlt, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './RentalPage.css';
import { fetchEquipment } from '../api/equipment';
import { createRental } from '../api/rental';
import { fetchClients } from '../api/clients';

// Утилиты
function getToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatSum(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function getDaysCount(start, end) {
  if (!start || !end) return 1;
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
}

const RentalPage = () => {
  const navigate = useNavigate();
  
  // Состояние шагов
  const [currentStep, setCurrentStep] = useState(1);
  const [rentalType, setRentalType] = useState('rent'); // 'rent' | 'book'
  
  // Данные
  const [equipment, setEquipment] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rentalCreated, setRentalCreated] = useState(false);
  
  // Шаг 1: Выбор клиента
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  
  // Шаг 2: Выбор техники
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  
  // Шаг 3: Даты
  const [dateStart, setDateStart] = useState(getToday());
  const [dateEnd, setDateEnd] = useState('');
  
  // Шаг 4: Стоимость
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('amount'); // 'amount' | 'percent'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [equipmentData, clientsData] = await Promise.all([
        fetchEquipment(),
        fetchClients()
      ]);
      setEquipment(equipmentData);
      setClients(clientsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация клиентов
  const filteredClients = clients.filter(client => {
    const query = clientSearch.toLowerCase();
    return (
      (client.full_name && client.full_name.toLowerCase().includes(query)) ||
      (client.passport_number && client.passport_number.toLowerCase().includes(query)) ||
      (client.phone && client.phone.toLowerCase().includes(query)) ||
      (client.email && client.email.toLowerCase().includes(query))
    );
  });

  // Фильтрация техники
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(equipmentSearch.toLowerCase());
    // Игнорируем складские ограничения: фильтр по доступности оставим только визуальным
    const matchesFilter = equipmentFilter === 'all' || 
      (equipmentFilter === 'available') ||
      (equipmentFilter === 'unavailable');
    return matchesSearch && matchesFilter;
  });

  // Добавить/удалить технику
  const handleEquipmentToggle = (item) => {
    setSelectedEquipment(prev => {
      const exists = prev.find(eq => eq.id === item.id);
      if (exists) {
        return prev.filter(eq => eq.id !== item.id);
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const handleQuantityChange = (id, delta) => {
    setSelectedEquipment(prev => {
      return prev.map(item => {
        if (item.id !== id) return item;
        const currentQty = Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 1;
        const next = currentQty + delta;
        const clamped = Math.max(1, next); // без верхней границы
        return { ...item, quantity: clamped };
      });
    });
  };

  const handleIncrease = (item) => {
    // Если не выбран — выбираем и ставим 1, затем увеличиваем
    setSelectedEquipment(prev => {
      const exists = prev.find(eq => eq.id === item.id);
      if (!exists) {
        return [...prev, { ...item, quantity: 2 }];
      }
      return prev.map(eq => eq.id === item.id ? { ...eq, quantity: Math.max(1, (Number(eq.quantity) || 1) + 1) } : eq);
    });
  };

  const handleDecrease = (item) => {
    setSelectedEquipment(prev => prev.map(eq => eq.id === item.id ? { ...eq, quantity: Math.max(1, (Number(eq.quantity) || 1) - 1) } : eq));
  };

  // Переход в профиль клиента
  const handleClientProfileClick = (clientId) => {
    navigate(`/clients/${clientId}`);
  };

  // Расчет стоимости
  const daysCount = getDaysCount(dateStart, dateEnd);
  const equipmentTotal = selectedEquipment.reduce((sum, item) => 
    sum + (item.price_per_day || 0) * item.quantity * daysCount, 0
  );
  
  const discountAmount = discountType === 'percent' 
    ? (equipmentTotal * discount / 100)
    : discount;
    
  const finalTotal = Math.max(0, equipmentTotal + deliveryFee - discountAmount);

  // Создание аренды
  const handleCreateRental = async () => {
    if (!selectedClient) {
      setError('Выберите клиента');
      setCurrentStep(1);
      return;
    }
    if (selectedEquipment.length === 0) {
      setError('Выберите технику');
      setCurrentStep(2);
      return;
    }
    if (!dateStart || !dateEnd) {
      setError('Укажите даты аренды');
      setCurrentStep(3);
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const items = selectedEquipment.map(item => ({
        equipment_id: item.id,
        quantity: item.quantity,
        price_per_day: item.price_per_day || 0
      }));

      await createRental({
        client_id: selectedClient.id,
        date_start: dateStart,
        date_end: dateEnd,
        total_amount: finalTotal,
        status: rentalType === 'book' ? 'booked' : 'active',
        items,
        comment: `Доставка: ${deliveryFee} сум, Скидка: ${discount} ${discountType === 'percent' ? '%' : 'сум'}`
      });

      setSuccess(rentalType === 'book' ? 'Бронь успешно оформлена!' : 'Аренда успешно оформлена!');
      setRentalCreated(true);
      // Не сбрасываем форму, чтобы пользователь мог видеть созданную аренду/бронь
      
    } catch (err) {
      setError(err.message);
    }
  };

  const steps = [
    { id: 1, title: 'Клиент', icon: FaUser },
    { id: 2, title: 'Техники', icon: FaBox },
    { id: 3, title: 'Даты аренды', icon: FaCalendarAlt },
    { id: 4, title: 'Стоимость', icon: FaMoneyBillWave },
    { id: 5, title: 'Завершение', icon: FaCheck }
  ];

  const progressPercent = Math.max(0, Math.min(100, ((currentStep - 1) / (steps.length - 1)) * 100));

  if (loading) {
    return (
      <div className="rental-page">
        <div className="rental-loading">
          <div className="loading-spinner"></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rental-page">
      {/* Заголовок */}
      <div className="rental-header">
        <h1 className="rental-title">
          {rentalType === 'book' ? 'Бронирование техники' : 'Аренда техники'}
        </h1>
        <div className="rental-type-selector">
          <button 
            className={`rental-type-btn ${rentalType === 'rent' ? 'active' : ''} ${rentalCreated ? 'disabled' : ''}`}
            onClick={() => !rentalCreated && setRentalType('rent')}
            disabled={rentalCreated}
          >
            <span>Аренда</span>
          </button>
          <button 
            className={`rental-type-btn ${rentalType === 'book' ? 'active' : ''} ${rentalCreated ? 'disabled' : ''}`}
            onClick={() => !rentalCreated && setRentalType('book')}
            disabled={rentalCreated}
          >
            <span>Бронь</span>
          </button>
        </div>
      </div>

      {/* Индикатор шагов */}
      <div className="rental-steps-wrapper">
        <div className="rental-steps-progress" aria-hidden>
          <div className="rental-steps-progress-bar" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="rental-steps" role="tablist" aria-label="Шаги оформления аренды">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`rental-step ${currentStep > step.id ? 'completed' : ''} ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}
              role="tab"
              aria-selected={currentStep === step.id}
              aria-current={currentStep === step.id ? 'step' : undefined}
            >
              <div className="rental-step-icon">
                <step.icon />
              </div>
              <div className="rental-step-content">
                <div className="rental-step-title">{step.title}</div>
                <div className="rental-step-number">{step.id}</div>
              </div>
              {index < steps.length - 1 && <div className="rental-step-line" />}
            </div>
          ))}
        </div>
      </div>

      {/* Контент шагов */}
      <div className="rental-content">
        {error && <div className="rental-error">{error}</div>}
        {success && <div className="rental-success">{success}</div>}
        
        <div key={currentStep} className="step-transition">

        {/* Шаг 1: Выбор клиента */}
        {currentStep === 1 && (
          <div className="rental-step-content">
            <h2 className="rental-step-title">Выберите клиента</h2>
            <div className="client-search-container">
              <div className="client-search-input">
                <FaSearch className="search-icon" />
                    <input
                      type="text"
                  placeholder="Поиск по ФИО, паспорту, телефону или email"
                  value={clientSearch}
                  onChange={(e) => {
                        setClientSearch(e.target.value);
                        setClientDropdownOpen(true);
                      }}
                      onFocus={() => setClientDropdownOpen(true)}
                />
              </div>
              
              {clientDropdownOpen && filteredClients.length > 0 && (
                <div className="client-dropdown">
                  {filteredClients.map(client => (
                    <div
                      key={client.id}
                      className={`client-option ${selectedClient?.id === client.id ? 'selected' : ''}`}
                    >
                      <div 
                        className="client-option-content"
                      onClick={() => {
                          setSelectedClient(client);
                              setClientSearch('');
                              setClientDropdownOpen(false);
                            }}
                          >
                        <div className="client-option-name">{client.full_name || 'Не указано'}</div>
                        <div className="client-option-details">
                          {client.passport_number && <span>Паспорт: {client.passport_number}</span>}
                          {client.phone && <span>Тел: {client.phone}</span>}
                          {client.email && <span>Email: {client.email}</span>}
                        </div>
                      </div>
                      <button 
                        className="client-option-profile-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClientProfileClick(client.id);
                        }}
                        title="Открыть профиль клиента"
                      >
                        <FaExternalLinkAlt />
                      </button>
                          </div>
                        ))}
                </div>
              )}
            </div>

            {selectedClient && (
              <div className="selected-client">
                <h3>Выбранный клиент:</h3>
                <div className="selected-client-card">
                  <div className="selected-client-header">
                    <div className="selected-client-name">{selectedClient.full_name || 'Не указано'}</div>
                    <button 
                      className="client-profile-btn"
                      onClick={() => handleClientProfileClick(selectedClient.id)}
                      title="Открыть профиль клиента"
                    >
                      <FaExternalLinkAlt />
                    </button>
                  </div>
                  <div className="selected-client-info">
                    <div>Паспорт: {selectedClient.passport_number || '—'}</div>
                    <div>Телефон: {selectedClient.phone || '—'}</div>
                    <div>Email: {selectedClient.email || '—'}</div>
                  </div>
                  <div className="selected-client-actions">
                    <button 
                      className="change-client-btn"
                      onClick={() => setSelectedClient(null)}
                    >
                      Изменить
                    </button>
                    <button 
                      className="view-profile-btn"
                      onClick={() => handleClientProfileClick(selectedClient.id)}
                    >
                      <FaExternalLinkAlt />
                      Профиль
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Шаг 2: Выбор техники */}
        {currentStep === 2 && (
          <div className="rental-step-content">
            <h2 className="rental-step-title">Выберите технику</h2>
            
            <div className="equipment-controls">
              <div className="equipment-search">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Поиск техники"
                  value={equipmentSearch}
                  onChange={(e) => setEquipmentSearch(e.target.value)}
                />
              </div>
              <div className="equipment-filters">
                <button 
                  className={`filter-btn ${equipmentFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setEquipmentFilter('all')}
                >
                  Все
                </button>
                <button 
                  className={`filter-btn ${equipmentFilter === 'available' ? 'active' : ''}`}
                  onClick={() => setEquipmentFilter('available')}
                >
                  Доступно
                </button>
                <button 
                  className={`filter-btn ${equipmentFilter === 'unavailable' ? 'active' : ''}`}
                  onClick={() => setEquipmentFilter('unavailable')}
                >
                  Недоступно
                </button>
              </div>
            </div>

            <div className="equipment-grid">
              {filteredEquipment.map(item => {
                const selectedItem = selectedEquipment.find(eq => eq.id === item.id);
                const isSelected = !!selectedItem;
                
                return (
                  <div key={item.id} className={`equipment-card ${isSelected ? 'selected' : ''} ${item.quantity_available === 0 ? 'unavailable' : ''}`}>
                    <div className="equipment-card-header">
                      <h3 className="equipment-title">{item.title}</h3>
                      <div className="equipment-category">{item.category_name || 'Без категории'}</div>
                    </div>
                    
                    <div className="equipment-info">
                      <div className="equipment-availability">
                        <span className="availability-label">Доступно:</span>
                        <span className={`availability-value ${item.quantity_available > 0 ? 'available' : 'unavailable'}`}>
                          {item.quantity_available} / {item.quantity_total}
                        </span>
                      </div>
                      <div className="equipment-price">
                        {item.price_per_day ? `${formatSum(item.price_per_day)} сум/день` : 'Цена не указана'}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="equipment-quantity">
                        <label>Количество:</label>
                        <div className="quantity-controls">
                          <button
                            type="button"
                            aria-label="Уменьшить количество"
                            onClick={(e) => { e.stopPropagation(); handleDecrease(item); }}
                          >
                            <FaMinus />
                          </button>
                          <span className="quantity-value">{selectedItem?.quantity || 1}</span>
                          <button
                            type="button"
                            aria-label="Увеличить количество"
                            onClick={(e) => { e.stopPropagation(); handleIncrease(item); }}
                          >
                            <FaPlus />
                          </button>
                        </div>
                      </div>
                    )}

                    <button 
                      className={`equipment-select-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleEquipmentToggle(item)}
                    >
                      {isSelected ? 'Убрать' : 'Выбрать'}
                    </button>
                  </div>
                );
              })}
            </div>

            {selectedEquipment.length > 0 && (
              <div className="selected-equipment-summary">
                <h3>Выбранная техника ({selectedEquipment.length}):</h3>
                <div className="selected-equipment-list">
                  {selectedEquipment.map(item => (
                    <div key={item.id} className="selected-equipment-item">
                      <span className="equipment-name">{item.title}</span>
                      <span className="equipment-quantity">× {item.quantity}</span>
                      <span className="equipment-price">
                        {formatSum((item.price_per_day || 0) * item.quantity)} сум/день
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Шаг 3: Даты */}
        {currentStep === 3 && (
          <div className="rental-step-content">
            <h2 className="rental-step-title">
              {rentalType === 'book' ? 'Выберите даты брони' : 'Выберите даты аренды'}
            </h2>
            
            <div className="date-selection">
              <div className="date-field">
                <label>Дата начала:</label>
                <input
                  type="date"
                  value={dateStart}
                  min={rentalType === 'book' ? getToday() : getToday()}
                  onChange={(e) => setDateStart(e.target.value)}
                />
              </div>
              
              <div className="date-field">
                <label>Дата окончания:</label>
                <input
                  type="date"
                  value={dateEnd}
                  min={dateStart || getToday()}
                  onChange={(e) => setDateEnd(e.target.value)}
                />
              </div>
            </div>

            {rentalType === 'book' && (
              <div className="booking-info">
                <div className="info-message">
                  <FaClock />
                  <span>Бронь позволяет зарезервировать технику на будущие даты</span>
                </div>
              </div>
            )}
            
            {dateStart && dateEnd && (
              <div className="date-info">
                <div className="date-duration">
                  <strong>Продолжительность:</strong> {getDaysCount(dateStart, dateEnd)} дней
                </div>
                <div className="date-timezone">
                  <small>Время указано по Ташкенту (UTC+5)</small>
                </div>
                {rentalType === 'book' && (
                  <div className="booking-status">
                    <small>Статус: <strong>Бронь</strong> (техника зарезервирована)</small>
                  </div>
                )}
              </div>
            )}
                    </div>
                  )}

        {/* Шаг 4: Стоимость */}
        {currentStep === 4 && (
          <div className="rental-step-content">
            <h2 className="rental-step-title">Расчет стоимости</h2>
            
            <div className="pricing-breakdown">
              <div className="pricing-item">
                <span>Стоимость техники ({daysCount} дней):</span>
                <span className="pricing-value">{formatSum(equipmentTotal)} сум</span>
              </div>

              <div className="pricing-additional">
                <div className="delivery-section">
                  <label>
                    <FaTruck className="icon" />
                    Доставка:
                  </label>
                  <input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                  />
                  <span>сум</span>
                </div>

                <div className="discount-section">
                  <label>
                    <FaPercent className="icon" />
                    Скидка:
                  </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                  />
                  <select 
                    value={discountType} 
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
                    <option value="amount">сум</option>
                    <option value="percent">%</option>
                  </select>
                </div>
              </div>

              <div className="pricing-total">
                <span>Итого к оплате:</span>
                <span className="total-amount">{formatSum(finalTotal)} сум</span>
              </div>
            </div>
          </div>
        )}

        {/* Шаг 5: Завершение */}
        {currentStep === 5 && (
          <div className="rental-step-content">
            <h2 className="rental-step-title">
              {rentalType === 'book' ? 'Подтверждение брони' : 'Подтверждение аренды'}
            </h2>
            
            <div className="rental-summary">
              <div className="summary-section">
                <h3>Клиент:</h3>
                <p>{selectedClient?.full_name || 'Не указано'}</p>
                <p>Паспорт: {selectedClient?.passport_number || '—'}</p>
                <p>Телефон: {selectedClient?.phone || '—'}</p>
              </div>

              <div className="summary-section">
                <h3>Техника:</h3>
                {selectedEquipment.map(item => (
                  <p key={item.id}>
                    {item.title} × {item.quantity} = {formatSum((item.price_per_day || 0) * item.quantity)} сум/день
                  </p>
                ))}
              </div>

              <div className="summary-section">
                <h3>Период:</h3>
                <p>С {dateStart} по {dateEnd}</p>
                <p>Продолжительность: {getDaysCount(dateStart, dateEnd)} дней</p>
              </div>

              <div className="summary-section">
                <h3>Стоимость:</h3>
                <p>Техника: {formatSum(equipmentTotal)} сум</p>
                {deliveryFee > 0 && <p>Доставка: {formatSum(deliveryFee)} сум</p>}
                {discount > 0 && (
                  <p>Скидка: {discount} {discountType === 'percent' ? '%' : 'сум'}</p>
                )}
                <p className="final-total">Итого: {formatSum(finalTotal)} сум</p>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Навигация */}
      <div className="rental-navigation">
        {currentStep > 1 && (
          <button 
            className="nav-btn prev-btn"
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            <FaArrowLeft />
            Назад
          </button>
        )}
        
        {currentStep < 5 && (
          <button 
            className="nav-btn next-btn"
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={
              (currentStep === 1 && !selectedClient) ||
              (currentStep === 2 && selectedEquipment.length === 0) ||
              (currentStep === 3 && (!dateStart || !dateEnd))
            }
          >
            Далее
            <FaArrowRight />
          </button>
        )}
        
        {currentStep === 5 && !rentalCreated && (
          <button 
            className="nav-btn finish-btn"
            onClick={handleCreateRental}
          >
            <FaCheck />
            {rentalType === 'book' ? 'Завершить бронь' : 'Завершить аренду'}
          </button>
        )}
        
        {rentalCreated && (
          <button 
            className="nav-btn new-rental-btn"
            onClick={() => {
              setRentalCreated(false);
              setCurrentStep(1);
              setSelectedClient(null);
              setSelectedEquipment([]);
              setDateStart(getToday());
              setDateEnd('');
              setDeliveryFee(0);
              setDiscount(0);
              setClientSearch('');
              setEquipmentSearch('');
              setError('');
              setSuccess('');
            }}
          >
            <FaPlus />
            Создать новую {rentalType === 'book' ? 'бронь' : 'аренду'}
          </button>
        )}
      </div>
    </div>
  );
};

export default RentalPage; 