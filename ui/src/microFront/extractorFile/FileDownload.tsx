import React, { useRef } from 'react';
import './fileDownload.css';
import { Upload, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FileDownloadProps {
  onUpload: (file: File) => void;
}

const FileDownload: React.FC<FileDownloadProps> = ({ onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = ''; // limpa o input
    }
  };

  return (
    <Card className="file-download-card">
      <div className="file-download-header">
        <FileText className="file-download-icon" />
        <div className="file-download-info">
          <h2>Extrator de Arquivos</h2>
          <p>Faça upload dos arquivos</p>
        </div>
        <Button className="file-download-button" onClick={handleUploadClick}>
          <Upload className="file-download-icon" />
          <span>Upload</span>
        </Button>
        <input
          type="file"
          ref={inputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </Card>
  );
};

export default FileDownload;
