import React, { useState } from 'react';
import './fileGrid.css';
import FileTypeFilter from './FileTypeFilter';
import FileViewerModal from './FileViewerModal';
import { Download, Eye } from 'lucide-react';

interface FileItem {
  name: string;
  type: string;
  size: string;
  date: string;
}

interface FileGridProps {
  files: FileItem[];
}

const FileGrid: React.FC<FileGridProps> = ({ files }) => {
  const [selectedType, setSelectedType] = useState('Todos');
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string } | null>(null);

  const fileTypes = Array.from(new Set(files.map(f => f.type)));

  const filteredFiles =
    selectedType === 'Todos' ? files : files.filter(f => f.type === selectedType);

  const getFileUrl = (file: FileItem) => `/arquivos/${file.name}`;

  const downloadFile = (file: FileItem) => {
    const link = document.createElement('a');
    link.href = getFileUrl(file);
    link.download = file.name;
    link.click();
  };

  return (
    <div className="file-grid-modern">
      <h2 className="file-grid-title">Arquivos Salvos</h2>

      <FileTypeFilter
        types={fileTypes}
        selectedType={selectedType}
        onSelect={setSelectedType}
      />

      <div className="file-grid-header">
        <span>Nome</span>
        <span>Tipo</span>
        <span>Tamanho</span>
        <span>Data</span>
        <span>Ação</span>
      </div>

      {filteredFiles.map((file, index) => (
        <div className="file-grid-row" key={index}>
          <span className="file-name">{file.name}</span>
          <span className={`file-pill type-${file.type.toLowerCase()}`}>{file.type}</span>
          <span className="file-size">{file.size}</span>
          <span className="file-date">{file.date}</span>
          <div className="file-actions">
            <button
              className="file-action"
              onClick={() => downloadFile(file)}
              title="Baixar"
            >
              <Download size={14} />
            </button>
            <button
              className="file-action view"
              onClick={() => setViewerFile({ url: getFileUrl(file), name: file.name })}
              title="Visualizar"
            >
              <Eye size={14} />
            </button>
          </div>
        </div>
      ))}

      {viewerFile && (
        <FileViewerModal
          fileUrl={viewerFile.url}
          fileName={viewerFile.name}
          onClose={() => setViewerFile(null)}
        />
      )}
    </div>
  );
};

export default FileGrid;
