import React, { useState, useEffect } from 'react';
import './fileGrid.css';
import FileTypeFilter from './FileTypeFilter';
import FileViewerModal from './FileViewerModal';
import { Download, Eye, Trash2 } from 'lucide-react';
import { statementsService } from '../../api/statementsService';
import { useNotification } from "../../context/NotificationService";

interface FileItem {
  id: number;
  name: string;
  type: string;
  size: string;
  date: string;
}

interface FileGridProps {
  files: FileItem[];
  onFileDelete?: (fileId: number) => void;
   refreshFiles?: () => void;
}

const FileGrid: React.FC<FileGridProps> = ({ files, onFileDelete, refreshFiles }) => {
  const [selectedType, setSelectedType] = useState('Todos');
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState<number | null>(null);
  const [deletingFiles, setDeletingFiles] = useState<number[]>([]);
  const [localFiles, setLocalFiles] = useState<FileItem[]>(files);

  const { notifySuccess, notifyError } = useNotification();

  useEffect(() => {
    setLocalFiles(files);
  }, [files]);

  const fileTypes = Array.from(new Set(localFiles.map(f => f.type)));


  const filteredFiles =
    selectedType === 'Todos' ? localFiles : localFiles.filter(f => f.type === selectedType);

  const downloadFile = async (file: FileItem) => {
    try {
      const blob = await statementsService.downloadPDF(file.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notifySuccess(`Download concluído: ${file.name}`);
    } catch (error) {      
      console.error('Erro ao baixar arquivo:', error);
      notifyError('Erro ao baixar arquivo.');
    }
  };

  const viewFile = async (file: FileItem) => {
    try {
      setIsLoading(file.id);
      const blob = await statementsService.downloadPDF(file.id);
      const url = URL.createObjectURL(blob);
      setViewerFile({ url, name: file.name });
    } catch (error) {
      console.error('Erro ao carregar arquivo:', error);
      notifyError('Erro ao carregar arquivo para visualização.');
    } finally {
      setIsLoading(null);
    }
  };

  const deleteFile = async (file: FileItem) => {
    if (!window.confirm(`TESTE do BOLINHA "${file.name}"?`)) {
      return;
    }

    try {
      setDeletingFiles(prev => [...prev, file.id]);
      await statementsService.deletePDF(file.id);
      
      setLocalFiles(prev => prev.filter(f => f.id !== file.id));

      if (onFileDelete) {
        onFileDelete(file.id);
      }

      if (refreshFiles) {
        refreshFiles();
      }
      
      notifySuccess('Arquivo excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      notifyError('Erro ao excluir arquivo.');
    } finally {
      setDeletingFiles(prev => prev.filter(id => id !== file.id));
    }
  };

  const handleCloseModal = () => {
    setViewerFile(null);
    if (viewerFile?.url) {
      URL.revokeObjectURL(viewerFile.url);
    }
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
              onClick={() => viewFile(file)}
              title="Visualizar"
              disabled={isLoading === file.id}
            >
              {isLoading === file.id ? (
                <div className="loading-spinner-small"></div>
              ) : (
                <Eye size={14} />
              )}
            </button>
            <button
              className="file-action delete"
              onClick={() => deleteFile(file)}
              title="Excluir"
              disabled={deletingFiles.includes(file.id)}
            >
              {deletingFiles.includes(file.id) ? (
                <div className="loading-spinner-small delete-spinner"></div>
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        </div>
      ))}

      {viewerFile && (
        <FileViewerModal
          fileUrl={viewerFile.url}
          fileName={viewerFile.name}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default FileGrid;