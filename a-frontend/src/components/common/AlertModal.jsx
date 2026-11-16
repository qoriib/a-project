import { useEffect } from "react";
import "./AlertModal.css";

/**
 * Reusable Alert & Confirmation Modal Component
 */
export function AlertModal({
  isOpen,
  type = "info", // "success" | "error" | "warning" | "info" | "confirm"
  title,
  message,
  confirmText = "OK",
  cancelText = "Batal",
  showCancel = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || isLoading) return;
      if (e.key === "Escape") {
        if (showCancel && onCancel) {
          onCancel();
        } else if (onConfirm) {
          onConfirm();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, showCancel, onCancel, onConfirm]);

  if (!isOpen) return null;

  const renderIcon = () => {
    switch (type) {
      case "success":
        return (
          <div className="alert-modal-icon-badge success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="alert-modal-icon-badge error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        );
      case "warning":
        return (
          <div className="alert-modal-icon-badge warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        );
      case "confirm":
        return (
          <div className="alert-modal-icon-badge confirm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        );
      case "info":
      default:
        return (
          <div className="alert-modal-icon-badge info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
        );
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      if (showCancel && onCancel) {
        onCancel();
      } else if (onConfirm) {
        onConfirm();
      }
    }
  };

  return (
    <div
      className="alert-modal-backdrop"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        className={`alert-modal-card alert-modal-${type}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
      >
        <div className="alert-modal-icon-container">{renderIcon()}</div>

        {title && (
          <h4 id="alert-modal-title" className="alert-modal-title">
            {title}
          </h4>
        )}

        {message && <div className="alert-modal-message">{message}</div>}

        <div className="alert-modal-actions">
          {showCancel && (
            <button
              type="button"
              className="alert-modal-btn alert-modal-btn-cancel"
              disabled={isLoading}
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            className={`alert-modal-btn alert-modal-btn-confirm alert-modal-btn-${type}`}
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading ? "Memproses..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertModal;
