import React, { useEffect } from 'react';

const ImageModal = ({ isOpen, src, alt, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="image-modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="image-modal-container">
        <button className="image-modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        <img src={src} alt={alt || 'Изображение'} className="image-modal-image" />
      </div>
    </div>
  );
};

export default ImageModal;


