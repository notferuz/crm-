import React from 'react';
import './Modal.css';

const Modal = ({ 
  show, 
  onClose, 
  onConfirm, 
  title = "Подтверждение", 
  message = "Вы уверены?", 
  confirmText = "Подтвердить", 
  cancelText = "Отмена" 
}) => {
  if (!show) return null;

  return (
    <div className={`modal-overlay ${show ? 'show' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        <div className="modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button className="modal-btn modal-btn-confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal; 