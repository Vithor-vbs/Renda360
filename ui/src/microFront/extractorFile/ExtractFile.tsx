import React, { useState } from 'react';
import './extractFile.css';
import FileDownload from './FileDownload';
import FileGrid from './FileGrid';

interface FileItem {
  name: string;
  type: string;
  size: string;
  date: string;
}

const ExtractFile: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([
    {
      name: 'fatura_maio.pdf',
      type: 'PDF',
      size: '1.2 MB',
      date: '2025-05-19 14:32',
    },
    {
      name: 'relatorio_abril.xlsx',
      type: 'Excel',
      size: '930 KB',
      date: '2025-05-18 09:12',
    },
  ]);

  const handleUpload = (file: File) => {
    const newFile: FileItem = {
      name: file.name,
      type: getFileType(file),
      size: formatFileSize(file.size),
      date: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    setFiles(prev => [...prev, newFile]);
  };

  const getFileType = (file: File): string => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'PDF';
    if (ext === 'xlsx' || ext === 'xls') return 'Excel';
    if (ext === 'csv') return 'CSV';
    return 'Outro';
  };

  const formatFileSize = (size: number): string => {
    return size >= 1000000
      ? `${(size / 1000000).toFixed(1)} MB`
      : `${(size / 1000).toFixed(0)} KB`;
  };

  return (
    <div className="extract-file-wrapper">
      <FileDownload onUpload={handleUpload} />
      <FileGrid files={files} />
    </div>
  );
};

export default ExtractFile;
  