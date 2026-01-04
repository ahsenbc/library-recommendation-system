import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal component props
 */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Reusable Modal component with backdrop and ESC key handler
 *
 * @example
 * <Modal isOpen={isOpen} onClose={handleClose} title="Add Book">
 *   <form>...</form>
 * </Modal>
 */
export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-6xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur effect */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-violet-900/40 to-indigo-900/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`
          relative
          bg-white/95 backdrop-blur-xl
          rounded-2xl shadow-2xl
          border border-white/20
          ${sizeClasses[size]}
          w-full
          mx-4
          p-6
          max-h-[90vh]
          overflow-y-auto
          transform transition-all duration-300
          animate-slide-in
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200/50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="
              text-slate-400 hover:text-slate-600
              transition-all duration-200
              p-2 rounded-lg
              hover:bg-slate-100
              focus:outline-none focus:ring-2 focus:ring-violet-500/20
            "
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="relative">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
