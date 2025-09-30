import React, { useState, useEffect } from 'react';
import './TechniquesPage.css';
import { FaPlus, FaFilter, FaSearch, FaTimes, FaImage, FaMinus, FaEdit, FaTrash } from 'react-icons/fa';
import cameraImg from '../assets/camera.png';
import { 
  fetchEquipment, 
  createEquipment, 
  updateEquipment, 
  deleteEquipment, 
  fetchCategories,
  createCategory
} from '../api/equipment';
import { uploadImage } from '../api/upload';
import { useUser } from '../context/UserContext';

function AddCategoryModal({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createCategory(formData);
      onSuccess(formData.name);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="add-technique-modal">
        <button className="modal-close-btn" onClick={onClose}><FaTimes /></button>
        <div className="add-technique-modal-content">
          <h2 className="modal-title">Добавить категорию</h2>
          {error && <div className="error-message">{error}</div>}
          <form className="add-technique-form" onSubmit={handleSubmit}>
            <label className="modal-label">
              Название категории
              <input
                className="modal-input"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Название категории"
                required
              />
            </label>
            <label className="modal-label">
              Описание
              <textarea
                className="modal-input modal-textarea"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Описание категории"
              />
            </label>
            <div className="modal-buttons">
              <button
                className="modal-submit-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Сохранение...' : 'Добавить'}
              </button>
              <button
                className="modal-cancel-btn"
                type="button"
                onClick={onClose}
                disabled={loading}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddTechniqueModal({ open, onClose, onSuccess, editingEquipment = null }) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    store_id: null,
    quantity_total: 1,
    price_per_day: 0,
    photos: '',
    status: 'available'
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const fileInputRef = React.useRef();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // Функция для получения URL изображения
  const getImageUrl = (photos) => {
    console.log('getImageUrl called with photos:', photos, 'type:', typeof photos);
    if (!photos || photos.trim() === '') {
      console.log('Photos is empty or null, returning null');
      return null;
    }
    if (photos.startsWith('http://') || photos.startsWith('https://')) {
      console.log('Photos is full URL, returning as is:', photos);
      return photos;
    }
    if (photos.startsWith('/')) {
      const fullUrl = `http://localhost:8000${photos}`;
      console.log('Photos is relative path, returning full URL:', fullUrl);
      return fullUrl;
    }
    const uploadUrl = `http://localhost:8000/upload/image/${photos}`;
    console.log('Photos is filename, returning upload URL:', uploadUrl);
    return uploadUrl;
  };

  useEffect(() => {
    if (open) {
      loadCategories();
      if (editingEquipment) {
        setFormData({
          title: editingEquipment.title || '',
          description: editingEquipment.description || '',
          category_id: editingEquipment.category_id || '',
          store_id: editingEquipment.store_id || user?.store_id,
          quantity_total: editingEquipment.quantity_total || 1,
          price_per_day: editingEquipment.price_per_day || 0,
          photos: editingEquipment.photos || '',
          status: editingEquipment.status || 'available'
        });
        if (editingEquipment.photos) {
          const imageUrl = getImageUrl(editingEquipment.photos);
          console.log('Setting image preview for editing:', editingEquipment.photos, '->', imageUrl);
          setImagePreview(imageUrl);
        } else {
          setImagePreview(null);
        }
      } else {
        setFormData({
          title: '',
          description: '',
          category_id: '',
          store_id: user?.store_id,
          quantity_total: 1,
          price_per_day: 0,
          photos: '',
          status: 'available'
        });
        setImagePreview(null);
      }
      setError('');
      setUploadingImage(false);
      setFileDialogOpen(false);
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setImagePreview(null);
      setError('');
      setUploadingImage(false);
      setFileDialogOpen(false);
    }
  }, [open, editingEquipment, user]);

  const loadCategories = async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handlePhotoClick = () => {
    if (uploadingImage || fileDialogOpen) return;
    if (fileInputRef.current) {
      setFileDialogOpen(true);
      // Не сбрасываем значение здесь, сбросим после обработки
      fileInputRef.current.click();
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadingImage) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const event = { target: { files: [file] } };
      handleFileChange(event);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    // Диалог закрыт, снимаем флаг, даже если файла нет
    setFileDialogOpen(false);
    if (file && !uploadingImage) {
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, выберите файл изображения (JPG, PNG, GIF)');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Размер файла не должен превышать 5MB');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setUploadingImage(true);
      setError('');
      try {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImagePreview(ev.target.result);
        };
        reader.readAsDataURL(file);
        const uploadResult = await uploadImage(file);
        if (uploadResult && uploadResult.url) {
          setFormData(prev => ({ ...prev, photos: uploadResult.url }));
        } else {
          throw new Error('Не удалось получить URL загруженного изображения');
        }
      } catch (err) {
        setError('Ошибка загрузки изображения: ' + err.message);
        setImagePreview(null);
      } finally {
        setUploadingImage(false);
        // Сбрасываем input после обработки, чтобы повторный выбор того же файла сработал, но без повторного открытия
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let data = { ...formData };
      if (!user?.store_id) {
        throw new Error('У пользователя не указан магазин. Обратитесь к администратору.');
      }
      if (data.store_id) data.store_id = parseInt(data.store_id);
      if (data.category_id) data.category_id = parseInt(data.category_id);
      if (data.quantity_total) data.quantity_total = parseInt(data.quantity_total);
      if (data.price_per_day) data.price_per_day = parseInt(data.price_per_day);
      if (!editingEquipment) {
        data.quantity_available = data.quantity_total;
      } else {
        // При редактировании корректируем доступное количество, сохраняя текущее количество в аренде
        const prevTotal = parseInt(editingEquipment.quantity_total || 0);
        const prevAvailable = parseInt(editingEquipment.quantity_available || 0);
        const newTotal = parseInt(data.quantity_total || prevTotal);
        const delta = newTotal - prevTotal; // изменение общего количества
        const proposedAvailable = prevAvailable + delta; // сохраняем текущее занятое кол-во
        const boundedAvailable = Math.max(0, Math.min(newTotal, proposedAvailable));
        data.quantity_available = boundedAvailable;
      }
      if (editingEquipment) {
        await updateEquipment(editingEquipment.id, data);
      } else {
        await createEquipment(data);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryAdded = async (newCategoryName) => {
    await loadCategories();
    const newCat = categories.find((cat) => cat.name === newCategoryName);
    if (newCat) {
      setFormData((prev) => ({ ...prev, category_id: newCat.id }));
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="modal-backdrop">
        <div className="add-technique-modal">
          <button className="modal-close-btn" onClick={onClose}><FaTimes /></button>
          <div className="add-technique-modal-content">
            <h2 className="modal-title">
              {editingEquipment ? 'Редактировать технику' : 'Добавить технику'}
            </h2>
            {error && <div className="error-message">{error}</div>}
            <form className="add-technique-form" onSubmit={handleSubmit}>
              <label className="modal-label">
                Название техники
                <input 
                  className="modal-input" 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Название техники" 
                  required
                />
              </label>
              <div className="modal-label">
                <div className="modal-label-row">
                  <span>Категория</span>
                  <button
                    type="button"
                    className="add-category-btn"
                    onClick={() => setCategoryModalOpen(true)}
                  >
                    + Категория
                  </button>
                </div>
                <select 
                  className="modal-input"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Выберите категорию</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <label className="modal-label">
                Фото
                <div 
                  className="modal-photo-drop" 
                  onClick={handlePhotoClick} 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  style={{
                    cursor: uploadingImage ? 'not-allowed' : 'pointer',
                    border: '2px dashed #ddd',
                    transition: 'border-color 0.3s ease'
                  }}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{display:'none'}} 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    disabled={uploadingImage}
                  />
                  {uploadingImage ? (
                    <div style={{textAlign: 'center', padding: '10px', color: '#666'}}>
                      <div style={{marginBottom: '5px'}}>⏳ Загрузка изображения...</div>
                      <div style={{fontSize: '12px'}}>Пожалуйста, подождите</div>
                    </div>
                  ) : imagePreview ? (
                    <div style={{position: 'relative'}}>
                      <img src={imagePreview} alt="preview" style={{maxWidth:'100%',maxHeight:40,borderRadius:6}} />
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreview(null);
                          setFormData(prev => ({ ...prev, photos: '' }));
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: -5,
                          right: -5,
                          background: '#ff3b30',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <FaImage className="modal-photo-icon" />
                      <div className="modal-photo-text">
                        Перетащите фото в эту область<br />либо нажмите на иконку
                      </div>
                    </>
                  )}
                </div>
              </label>
              <div className="modal-row">
                <label className="modal-label">
                  Общее количество
                  <div className="modal-count-row">
                    <button 
                      type="button" 
                      className="modal-count-btn" 
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        quantity_total: Math.max(1, prev.quantity_total - 1) 
                      }))}
                    >
                      <FaMinus />
                    </button>
                    <span className="modal-count-value">{formData.quantity_total}</span>
                    <button 
                      type="button" 
                      className="modal-count-btn" 
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        quantity_total: prev.quantity_total + 1 
                      }))}
                    >
                      <FaPlus />
                    </button>
                  </div>
                </label>
              </div>
              <label className="modal-label">
                Цена за день (сум)
                <input 
                  className="modal-input" 
                  type="number" 
                  name="price_per_day"
                  value={formData.price_per_day}
                  onChange={handleInputChange}
                  placeholder="0" 
                  min="0"
                  step="0.01"
                  required
                />
              </label>
              <label className="modal-label">
                Описание
                <textarea 
                  className="modal-input modal-textarea" 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Описание техники" 
                />
              </label>
              <div className="modal-buttons">
                <button 
                  className="modal-submit-btn" 
                  type="submit"
                  disabled={loading || uploadingImage}
                >
                  {loading ? 'Сохранение...' : (editingEquipment ? 'Сохранить' : 'Добавить')}
                </button>
                <button 
                  className="modal-cancel-btn" 
                  type="button" 
                  onClick={onClose}
                  disabled={loading || uploadingImage}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <AddCategoryModal open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} onSuccess={handleCategoryAdded} />
    </>
  );
}

const TechniquesPage = () => {
  const { user } = useUser();
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  
  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => (
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    ));
  };

  // Функция для получения URL изображения в карточках техники
  const getImageUrl = (photos) => {
    if (!photos || photos.trim() === '') {
      return cameraImg;
    }
    if (photos.startsWith('http://') || photos.startsWith('https://')) {
      return photos;
    }
    if (photos.startsWith('/')) {
      return `http://localhost:8000${photos}`;
    }
    return `http://localhost:8000/upload/image/${photos}`;
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [modalOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [equipmentData, categoriesData] = await Promise.all([
        fetchEquipment(),
        fetchCategories()
      ]);
      setEquipment(equipmentData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipment = () => {
    setEditingEquipment(null);
    setModalOpen(true);
  };

  const handleEditEquipment = (equipment) => {
    setEditingEquipment(equipment);
    setModalOpen(true);
  };

  const handleDeleteEquipment = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту технику?')) {
      try {
        await deleteEquipment(id);
        setEquipment(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        alert('Ошибка при удалении: ' + err.message);
      }
    }
  };

  const handleModalSuccess = () => {
    loadData();
  };

  // Фильтрация оборудования
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || 
                           selectedCategories.includes(item.category_id);
    const matchesStatus = selectedStatuses.length === 0 || 
                         selectedStatuses.includes(item.status);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Неизвестно';
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Доступно';
      case 'rented': return 'В аренде';
      case 'maintenance': return 'На обслуживании';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'green';
      case 'rented': return 'blue';
      case 'maintenance': return 'red';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="techniques-page">
        <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' }}>
          Загрузка техники...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="techniques-page">
        <div style={{ textAlign: 'center', padding: '50px', color: '#ff3b30' }}>
          <h3>Ошибка загрузки данных</h3>
          <p>{error}</p>
          <button 
            onClick={loadData}
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
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="techniques-page">
      <div className="techniques-header">
        <h1 className="techniques-title">
          Техника <span className="techniques-count">({filteredEquipment.length})</span>
        </h1>
        <div className="techniques-controls">
          <div className="techniques-search">
            <span className="search-icon"><FaSearch /></span>
            <input 
              type="text" 
              placeholder="Поиск по названию и описанию" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Убран выпадающий фильтр рядом с поиском */}
          {(user?.role === 'store_admin' || user?.role === 'superadmin') && (
            <button className="add-technique-btn" onClick={handleAddEquipment}>
              <FaPlus />
              <span className="add-technique-text">Добавить технику</span>
            </button>
          )}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="category-chips">
          <button
            className={`chip ${selectedCategories.length === 0 ? 'active' : ''}`}
            onClick={() => setSelectedCategories([])}
          >
            Все
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              className={`chip ${selectedCategories.includes(category.id) ? 'active' : ''}`}
              onClick={() => toggleCategory(category.id)}
              title={category.description || category.name}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {filteredEquipment.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          {searchTerm || selectedCategories.length > 0 || selectedStatuses.length > 0 
            ? 'По вашему запросу ничего не найдено' 
            : 'Техника не найдена'}
        </div>
      ) : (
        <div className="techniques-grid">
          {filteredEquipment.map((tech) => (
            <div className="technique-card" key={tech.id}>
              <div className="technique-image-wrap">
                {getImageUrl(tech.photos) ? (
                  <img 
                    src={getImageUrl(tech.photos)} 
                    alt={tech.title} 
                    className="technique-image"
                    onError={(e) => { e.target.src = cameraImg; }}
                  />
                ) : (
                  <div 
                    className="technique-image" 
                    style={{
                      background: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                      fontSize: '12px'
                    }}
                  >
                    Нет фото
                  </div>
                )}
                <div className={`technique-status-badge status-${getStatusColor(tech.status)}`}>
                  {getStatusText(tech.status)}
                </div>
              </div>
              <div className="technique-info">
                <div className="technique-name">{tech.title}</div>
                <div className="technique-category">
                  Категория: {getCategoryName(tech.category_id)}
                </div>
                <div className="technique-price">
                  Цена: {tech.price_per_day?.toLocaleString() || 0} сум/день
                </div>
                <div className="technique-count">
                  Количество: {tech.quantity_available ?? 0} / {tech.quantity_total ?? 0}
                </div>
                {tech.description && (
                  <div className="technique-description">{tech.description}</div>
                )}
              </div>
              {(user?.role === 'store_admin' || user?.role === 'superadmin') && (
                <div className="technique-actions">
                  <button 
                    className="edit-technique-btn"
                    onClick={() => handleEditEquipment(tech)}
                  >
                    <FaEdit /> Редактировать
                  </button>
                  <button 
                    className="delete-technique-btn"
                    onClick={() => handleDeleteEquipment(tech.id)}
                  >
                    <FaTrash /> Удалить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AddTechniqueModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        editingEquipment={editingEquipment}
      />
    </div>
  );
};

export default TechniquesPage; 