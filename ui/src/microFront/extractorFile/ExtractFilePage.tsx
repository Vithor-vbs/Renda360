import React from 'react';
import './extractorFilePage.css';
import ExtractFile from './ExtractFile';

const ExtractFilePage: React.FC = () => (
  <div className="extractor-file-page-container">
    <div className="extractor-file-page-main">
      <ExtractFile />
    </div>
  </div>
);

export default ExtractFilePage;
