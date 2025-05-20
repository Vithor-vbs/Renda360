import React from 'react';
import './fileGrid.css';

interface FileTypeFilterProps {
  types: string[];
  selectedType: string;
  onSelect: (type: string) => void;
}

const FileTypeFilter: React.FC<FileTypeFilterProps> = ({ types, selectedType, onSelect }) => {
  return (
    <div className="file-type-filter">
      {['Todos', ...types].map((type) => (
        <button
          key={type}
          className={`file-type-pill ${selectedType === type ? 'active' : ''}`}
          onClick={() => onSelect(type)}
        >
          {type}
        </button>
      ))}
    </div>
  );
};

export default FileTypeFilter;
