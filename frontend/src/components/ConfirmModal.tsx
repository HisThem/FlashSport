import React from 'react';
import { createPortal } from 'react-dom';

export interface ConfirmModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info'; // 按钮类型
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalConfig> = ({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'info',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'btn-error';
      case 'warning':
        return 'btn-warning';
      default:
        return 'btn-primary';
    }
  };

  const modalContent = (
    <div className="modal modal-open z-[60]">
      <div className="modal-box modal-bounce w-full max-w-md">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4 text-base-content/80 whitespace-pre-line">{message}</p>
        <div className="modal-action">
          <button 
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            className={`btn ${getButtonClass()}`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                处理中...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmModal;
