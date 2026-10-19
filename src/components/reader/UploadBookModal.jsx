import { useEffect, useState } from "react";
import {
  FaInfo,
  FaTimes,
  FaUpload,
} from "react-icons/fa";
import { IoWarningOutline } from "react-icons/io5";

import './UploadBookModal.scss';

const UploadBookModal = ({
  file,
  onCancel,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [licenseAccepted, setLicenseAccepted] =
    useState(false);

  useEffect(() => {
    setLicenseAccepted(false);
  }, [file]);

  const handleConfirm = async () => {
    if (!licenseAccepted || loading) {
      return;
    }

    try {
      setLoading(true);

      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  if (!file) return null;

  const fileSizeMb = (
    file.size /
    1024 /
    1024
  ).toFixed(2);

  return (
    <div
      className="book-upload-modal"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onCancel();
        }
      }}
    >
      <div className="book-upload-modal__content">
        <button
          type="button"
          className="book-upload-modal__close"
          onClick={onCancel}
          disabled={loading}
          aria-label="Close"
        >
          <FaTimes />
        </button>

        <div className="book-upload-modal__icon">
          <IoWarningOutline />
           
        </div>

        <h3>
          Upload this book?
        </h3>

        <p className="book-upload-modal__name">
          {file.name}
        </p>

        <div className="book-upload-modal__meta">
          <span>
            {file.type || "Book file"}
          </span>

          <span>
            {fileSizeMb} MB
          </span>
        </div>

        {/* LICENSE AGREEMENT */}
        <label className="book-upload-modal__agreement">
          <input
            type="checkbox"
            checked={licenseAccepted}
            onChange={(event) =>
              setLicenseAccepted(event.target.checked)
            }
            disabled={loading}
          />

          <span className="book-upload-modal__agreement-text">
            I confirm that I have the legal right to upload this file. The book was purchased by me or obtained legally, and its upload and use do not violate copyright or the terms of the applicable license. I am not uploading a pirated or illegally obtained copy.
          </span>
        </label>

        <div className="book-upload-modal__actions">
          <button
            type="button"
            className="book-upload-modal__cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="book-upload-modal__confirm"
            onClick={handleConfirm}
            disabled={
              loading || !licenseAccepted
            }
          >
            {loading ? (
              "Uploading..."
            ) : (
              <>
                <FaUpload />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadBookModal;