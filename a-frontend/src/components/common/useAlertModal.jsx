import { useState, useCallback } from "react";
import AlertModal from "./AlertModal";

/**
 * Custom Hook for managing Alert Modal state cleanly
 */
export function useAlertModal() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "OK",
    cancelText: "Batal",
    showCancel: false,
    isLoading: false,
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = useCallback(
    ({
      type = "info",
      title = "",
      message = "",
      confirmText = "OK",
      cancelText = "Batal",
      showCancel = false,
      onConfirm = null,
      onCancel = null,
    }) => {
      setModalState({
        isOpen: true,
        type,
        title,
        message,
        confirmText,
        cancelText,
        showCancel,
        isLoading: false,
        onConfirm,
        onCancel,
      });
    },
    [],
  );

  const closeModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
      isLoading: false,
      onConfirm: null,
      onCancel: null,
    }));
  }, []);

  const handleConfirm = useCallback(() => {
    const callback = modalState.onConfirm;
    closeModal();
    if (typeof callback === "function") {
      callback();
    }
  }, [modalState.onConfirm, closeModal]);

  const handleCancel = useCallback(() => {
    const callback = modalState.onCancel;
    closeModal();
    if (typeof callback === "function") {
      callback();
    }
  }, [modalState.onCancel, closeModal]);

  const setModalLoading = useCallback((loading) => {
    setModalState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const AlertModalComponent = (
    <AlertModal
      isOpen={modalState.isOpen}
      type={modalState.type}
      title={modalState.title}
      message={modalState.message}
      confirmText={modalState.confirmText}
      cancelText={modalState.cancelText}
      showCancel={modalState.showCancel}
      isLoading={modalState.isLoading}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return {
    modalState,
    showAlert,
    closeModal,
    setModalLoading,
    AlertModalComponent,
  };
}

export default useAlertModal;
