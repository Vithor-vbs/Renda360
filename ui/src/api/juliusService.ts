import api from "./axios";
import { JuliusMessage, ConversationStatus } from "./types";

export interface JuliusAskRequest {
  question: string;
  session_id?: string;
  optimization_level?: "aggressive" | "balanced" | "quality";
}

export interface JuliusAskResponse {
  answer: string;
  session_id: string;
  response_time_ms?: number;
  query_type?: string;
  optimization_level?: string;
  error?: boolean;
}

export class JuliusService {
  /**
   * Ask Julius a question
   */
  static async ask(request: JuliusAskRequest): Promise<JuliusAskResponse> {
    const response = await api.post("/julius/ask", request);
    return response.data;
  }

  /**
   * Get conversation history
   */
  static async getConversationHistory(
    sessionId?: string,
    limit: number = 20
  ): Promise<{
    success: boolean;
    messages: JuliusMessage[];
    session_id: string | null;
    total_messages: number;
  }> {
    const params = new URLSearchParams({ limit: limit.toString() });

    if (sessionId) {
      params.append("session_id", sessionId);
    }

    const response = await api.get(
      `/julius/conversation/history?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Clear current conversation
   */
  static async clearConversation(sessionId?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const data = sessionId ? { session_id: sessionId } : {};
    const response = await api.post("/julius/conversation/clear", data);
    return response.data;
  }

  /**
   * Get conversation status
   */
  static async getConversationStatus(): Promise<{
    success: boolean;
    conversation: ConversationStatus | null;
  }> {
    const response = await api.get("/julius/conversation/status");
    return response.data;
  }

  /**
   * Update embeddings after new PDF upload
   */
  static async updateEmbeddings(pdfId?: number): Promise<{
    message: string;
  }> {
    const data = pdfId ? { pdf_id: pdfId } : {};
    const response = await api.post("/julius/update_embeddings", data);
    return response.data;
  }
}
