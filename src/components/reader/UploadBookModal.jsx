import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { FaTimes } from "react-icons/fa";

const UploadBookModal = ({ file, onConfirm, onClose }) => {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md px-8 py-16"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          <FaTimes className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          Confirmation of the legality of the book
        </h2>

        <p className="mb-4 text-gray-700 dark:text-gray-300">
          You have selected a file.: <strong>{file?.name}</strong>. Confirm that this book was purchased and is not pirated.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="agreement"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label htmlFor="agreement" className="text-gray-700 dark:text-gray-300">
            I confirm that this book was purchased and is not pirated.
          </label>
        </div>

        <button
          className="w-full bg-[var(--accept-color)] hover:bg-[var(--accept-color-hover)] text-white py-2 rounded"
          onClick={() => {
            if (!agreed) {
              toast.info("Please confirm the legality of the book.");
              return;
            }
            onConfirm(file);
            onClose();
          }}
        >
          Confirm and upload
        </button>
      </div>
    </div>,
    document.body
  );
};

export default UploadBookModal;