import React from 'react';
import './fileViewerModal.css';

interface FileViewerModalProps {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
}

const FileViewerModal: React.FC<FileViewerModalProps> = ({ fileUrl, fileName, onClose }) => {
  return (
    <div className="file-modal-overlay">
      <div className="file-modal-content">
        <div className="file-modal-header">
          <h3>{fileName}</h3>
          <button onClick={onClose} className="file-modal-close">✖</button>
        </div>
        <iframe
          src={fileUrl}
          title={fileName}
          className="file-modal-iframe"
        />
      </div>
    </div>
  );
};

export default FileViewerModal;
