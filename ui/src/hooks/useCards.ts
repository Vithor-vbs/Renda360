import { useState, useEffect } from "react";
import { CardService, Card, PDFExtractable } from "../api";

export const useCards = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await CardService.getCards();
      setCards(result);
    } catch (err: any) {
      console.error("Cards fetch error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to fetch cards"
      );
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchCards();
  };

  useEffect(() => {
    fetchCards();
  }, []);

  return {
    cards,
    loading,
    error,
    refresh,
    fetchCards,
  };
};

export const useCardStatements = (cardId: number) => {
  const [statements, setStatements] = useState<PDFExtractable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await CardService.getCardStatements(cardId);
      setStatements(result);
    } catch (err: any) {
      console.error("Card statements fetch error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch statements"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cardId) {
      fetchStatements();
    }
  }, [cardId]);

  return {
    statements,
    loading,
    error,
    refresh: fetchStatements,
  };
};

export const useCardUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadStatement = async (
    cardNumber: string,
    file: File
  ): Promise<PDFExtractable | null> => {
    try {
      setUploading(true);
      setError(null);
      const result = await CardService.uploadStatement(cardNumber, file);
      return result;
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to upload statement"
      );
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadStatement,
    uploading,
    error,
  };
};
