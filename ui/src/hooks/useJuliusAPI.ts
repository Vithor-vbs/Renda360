import { useState, useCallback } from "react";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

export interface JuliusResponse {
  answer: string;
  error: boolean;
  query_type: string;
  optimization_level: string;
  response_time_ms: number;
  session_id: string;
  cost_estimate?: number;
}

export interface ConversationHistory {
  success: boolean;
  session_id: string;
  messages: Array<{
    id: number;
    message_type: "user" | "assistant";
    content: string;
    created_at: string;
    query_type?: string;
    optimization_level?: string;
    response_time_ms?: number;
    cost_estimate?: number;
  }>;
  total_messages: number;
}

export const useJuliusAPI = () => {
  const { loggedUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("access_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  const askJulius = useCallback(
    async (
      question: string,
      sessionId?: string,
      optimizationLevel: "aggressive" | "balanced" | "quality" = "aggressive"
    ): Promise<JuliusResponse | null> => {
      if (!loggedUser) {
        setError("User not authenticated");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.post(
          "/julius/ask",
          {
            question,
            user_id: loggedUser.id,
            session_id: sessionId,
            optimization_level: optimizationLevel,
          },
          {
            headers: getAuthHeaders(),
          }
        );

        return response.data;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Falha ao enviar pergunta";
        setError(errorMessage);
        console.error("Julius AI error:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [loggedUser, getAuthHeaders]
  );

  const getConversationHistory = useCallback(
    async (limit: number = 50): Promise<ConversationHistory | null> => {
      if (!loggedUser) {
        setError("User not authenticated");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get("/julius/conversation/history", {
          headers: getAuthHeaders(),
          params: {
            user_id: loggedUser.id,
            limit,
          },
        });

        return response.data;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Falha ao carregar histórico";
        setError(errorMessage);
        console.error("Conversation history error:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [loggedUser, getAuthHeaders]
  );

  const clearConversation = useCallback(async (): Promise<boolean> => {
    if (!loggedUser) {
      setError("User not authenticated");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "/julius/conversation/clear",
        {
          user_id: loggedUser.id,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      return response.data.success;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Falha ao limpar conversa";
      setError(errorMessage);
      console.error("Clear conversation error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loggedUser, getAuthHeaders]);

  const getConversationStatus = useCallback(async () => {
    if (!loggedUser) {
      setError("User not authenticated");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get("/julius/conversation/status", {
        headers: getAuthHeaders(),
        params: {
          user_id: loggedUser.id,
        },
      });

      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Falha ao obter status da conversa";
      setError(errorMessage);
      console.error("Conversation status error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loggedUser, getAuthHeaders]);

  return {
    askJulius,
    getConversationHistory,
    clearConversation,
    getConversationStatus,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};
