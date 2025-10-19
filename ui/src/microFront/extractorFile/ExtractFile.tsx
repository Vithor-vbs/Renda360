import React, { useState, useEffect } from "react";
import "./extractFile.css";
import FileDownload from "./FileDownload";
import FileGrid from "./FileGrid";
import { statementsService, Card } from "../../api/statementsService";
import { useNotification } from "../../context/NotificationService";

interface FileItem {
  id: number; 
  name: string;
  type: string;
  size: string;
  date: string;
  status?: "processing" | "completed" | "error";
}

const ExtractFile: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const { notifySuccess, notifyError } = useNotification();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load user cards
      const userCards = await statementsService.getCards();
      setCards(userCards);

      // Auto-select first card if available
      if (userCards.length > 0) {
        setSelectedCard(userCards[0]);
      }

      // Load existing PDFs
      const pdfs = await statementsService.getAllPDFs();
      const fileItems: FileItem[] = pdfs.map((pdf) => ({
        id: pdf.id,
        name: pdf.file_name,
        type: "PDF",
        size: "N/A",
        date: new Date(pdf.uploaded_at)
          .toISOString()
          .slice(0, 16)
          .replace("T", " "),
        status: "completed",
      }));
      setFiles(fileItems);
    } catch (err) {
      console.error("Error loading initial data:", err);
      notifyError("Erro ao carregar dados. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!selectedCard) {
      notifyError("Selecione um cartão antes de fazer upload");
      return;
    }

    const tempId = -Date.now();

    const tempFileItem: FileItem = {
      id: tempId,
      name: file.name,
      type: getFileType(file),
      size: formatFileSize(file.size),
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      status: "processing",
    };
    setFiles((prev) => [...prev, tempFileItem]);

    try {
      setUploading(true);

      const response = await statementsService.uploadPDF(
        file,
        selectedCard.number
      );

      await loadInitialData();

      notifySuccess(`Upload concluído: ${response.msg}`);
    } catch (err) {
      console.error("Upload error:", err);

      setFiles((prev) => prev.filter((f) => f.id !== tempId));

      if (err instanceof Error) {
        if (
          err.message.includes("Duplicate") ||
          err.message.includes("duplicate")
        ) {
          notifyError(`Arquivo duplicado.`);
        } else if (err.message.includes("same name")) {
          notifyError(
            `Arquivo com mesmo nome já existe. Renomeie o arquivo se for conteúdo diferente.`
          );
        } else if (err.message.includes("same period")) {
          notifyError(
            `Já existe fatura para este período. Verifique se não é uma duplicata.`
          );
        } else {
          notifyError(`Erro no upload: ${err.message}`);
        }
      } else {
        notifyError("Erro desconhecido durante o upload");
      }
    } finally {
      setUploading(false);
    }
  };

  const getFileType = (file: File): string => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "PDF";
    if (ext === "xlsx" || ext === "xls") return "Excel";
    if (ext === "csv") return "CSV";
    return "Outro";
  };

  const formatFileSize = (size: number): string => {
    return size >= 1000000
      ? `${(size / 1000000).toFixed(1)} MB`
      : `${(size / 1000).toFixed(0)} KB`;
  };

  if (loading) {
    return (
      <div className="extract-file-wrapper">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="extract-file-wrapper">
      {/* Card Selection */}
      {cards.length > 0 && (
        <div className="card-selection">
          <label htmlFor="card-select">Selecionar Cartão:</label>
          <select
            id="card-select"
            value={selectedCard?.id || ""}
            onChange={(e) => {
              const cardId = parseInt(e.target.value);
              const card = cards.find((c) => c.id === cardId);
              setSelectedCard(card || null);
            }}
          >
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name} (...{card.number.slice(-4)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Upload component */}
      <FileDownload onUpload={handleUpload} />

      {/* Upload status */}
      {uploading && (
        <div className="upload-status">
          <div className="spinner"></div>
          <p>Processando PDF...</p>
        </div>
      )}

      {/* File Grid */}
      <FileGrid files={files} />
    </div>
  );
};

export default ExtractFile;