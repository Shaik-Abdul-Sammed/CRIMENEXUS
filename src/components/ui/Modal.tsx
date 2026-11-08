import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
  maxWidth,
}: ModalProps) {
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    full: 'max-w-[95vw] w-[95vw]',
  };

  const titleId = title ? 'modal-title' : undefined;
  const descriptionId = description ? 'modal-description' : undefined;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="min-h-full flex justify-center p-2 sm:p-4 md:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={modalRef}
          className={cn(
            'relative w-full my-auto rounded-xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden focus:outline-none flex flex-col max-h-[92vh]',
            maxWidth || sizeClasses[size],
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
        >
          <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
            <div>
              {title && (
                <h2 id={titleId} className="text-lg font-semibold text-foreground">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="text-sm text-muted-foreground mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              aria-label="Close modal dialog"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <div className="p-5 flex-1 min-h-0 overflow-y-auto overscroll-contain modal-body-scroll">{children}</div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
