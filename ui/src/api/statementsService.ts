import { AuthService } from "./authService";

const API_BASE_URL = "http://localhost:5000";

export interface Card {
  id: number;
  number: string;
  expiration_date: string;
  name: string;
  used_limit: number;
  available_limit: number;
}

export interface PDFFile {
  id: number;
  file_name: string;
  uploaded_at: string;
  statement_date: string;
  statement_period_start: string;
  statement_period_end: string;
  previous_invoice: number;
  payment_received: number;
  total_purchases: number;
  other_charges: number;
  total_to_pay: number;
  next_closing_date: string;
  next_invoice_balance: number;
  total_open_balance: number;
  summary_json: string;
}

export interface UploadResponse {
  msg: string;
}

class StatementsService {
  private getAuthHeaders() {
    const token = AuthService.getToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async getCards(): Promise<Card[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/cards`, {
        method: "GET",
        headers: {
          ...this.getAuthHeaders(),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching cards: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching cards:", error);
      throw error;
    }
  }

  async getPDFsForCard(cardId: number): Promise<PDFFile[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/${cardId}/pdfs`, {
        method: "GET",
        headers: {
          ...this.getAuthHeaders(),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching PDFs: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching PDFs:", error);
      throw error;
    }
  }

  async uploadPDF(file: File, cardNumber: string): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("card_number", cardNumber);

      const response = await fetch(`${API_BASE_URL}/upload_pdf`, {
        method: "POST",
        headers: {
          ...this.getAuthHeaders(),
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle different HTTP status codes appropriately
        if (response.status === 409) {
          // Duplicate detected - use the detailed message from backend
          const duplicateType = errorData.duplicate_type || "unknown";
          let message = errorData.msg || "Arquivo duplicado detectado";

          if (duplicateType === "file_hash") {
            message = "Arquivo idêntico já foi enviado anteriormente";
          } else if (duplicateType === "filename") {
            message = `Arquivo com mesmo nome já existe: ${errorData.existing_filename}`;
          } else if (duplicateType === "statement_period") {
            message = "Já existe uma fatura para este período";
          }

          throw new Error(message);
        }

        throw new Error(
          errorData.msg || `Upload failed: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error uploading PDF:", error);
      throw error;
    }
  }

  async getAllPDFs(): Promise<PDFFile[]> {
    try {
      // First get all cards
      const cards = await this.getCards();

      // Then get PDFs for each card
      const allPDFs: PDFFile[] = [];
      for (const card of cards) {
        const cardPDFs = await this.getPDFsForCard(card.id);
        allPDFs.push(...cardPDFs);
      }

      // Sort by uploaded_at descending (newest first)
      return allPDFs.sort(
        (a, b) =>
          new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      );
    } catch (error) {
      console.error("Error fetching all PDFs:", error);
      throw error;
    }
  }

  
  async downloadPDF(pdfId: number): Promise<Blob> {
    try {
      const response = await fetch(`${API_BASE_URL}/pdf/${pdfId}`, {
        method: "GET",
        headers: {
          ...this.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Error downloading PDF: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error("Error downloading PDF:", error);
      throw error;
    }
  }

  async deletePDF(pdfId: number): Promise<{ msg: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/pdf/${pdfId}`, {
        method: "DELETE",
        headers: {
          ...this.getAuthHeaders(),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error deleting PDF: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting PDF:", error);
      throw error;
    }
  }
}
export const statementsService = new StatementsService();
