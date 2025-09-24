import api from "./axios";
import { Card, PDFExtractable, Transaction, DateRange } from "./types";

export class CardService {
  /**
   * Get all cards for the authenticated user
   */
  static async getCards(): Promise<Card[]> {
    const response = await api.get("/cards");
    return response.data;
  }

  /**
   * Get a specific card by ID
   */
  static async getCard(cardId: number): Promise<Card> {
    const response = await api.get(`/cards/${cardId}`);
    return response.data;
  }

  /**
   * Create a new card
   */
  static async createCard(
    cardData: Omit<Card, "id" | "user_id" | "created_at" | "updated_at">
  ): Promise<Card> {
    const response = await api.post("/cards", cardData);
    return response.data;
  }

  /**
   * Update card information
   */
  static async updateCard(
    cardId: number,
    cardData: Partial<Card>
  ): Promise<Card> {
    const response = await api.put(`/cards/${cardId}`, cardData);
    return response.data;
  }

  /**
   * Delete a card
   */
  static async deleteCard(cardId: number): Promise<void> {
    await api.delete(`/cards/${cardId}`);
  }

  /**
   * Get all PDF statements for a specific card
   */
  static async getCardStatements(cardId: number): Promise<PDFExtractable[]> {
    const response = await api.get(`/cards/${cardId}/pdfs`);
    return response.data;
  }

  /**
   * Upload a new PDF statement
   */
  static async uploadStatement(
    cardNumber: string,
    file: File
  ): Promise<PDFExtractable> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("card_number", cardNumber);

    const response = await api.post("/upload_pdf", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
}
