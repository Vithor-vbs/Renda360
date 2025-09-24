import { createContext, useContext, useState, useEffect } from "react";
import axios from "../api/axios";
import { useAuth } from "./AuthContext";

type Message = {
  id: number;
  message_type: "user" | "assistant";
  content: string;
  created_at: string;
  query_type?: string;
  optimization_level?: string;
  response_time_ms?: number;
  cost_estimate?: number;
};

type ConversationStatus = {
  session_id: string;
  total_messages: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type JuliusContextType = {
  messages: Message[];
  loading: boolean;
  sessionId: string | null;
  conversationStatus: ConversationStatus | null;
  sendMessage: (question: string) => Promise<void>;
  clearConversation: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  error: string | null;
};

const JuliusContext = createContext<JuliusContextType>({
  messages: [],
  loading: false,
  sessionId: null,
  conversationStatus: null,
  sendMessage: async () => {},
  clearConversation: async () => {},
  refreshHistory: async () => {},
  error: null,
});

export const JuliusProvider = ({ children }: { children: React.ReactNode }) => {
  const { loggedUser, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversationStatus, setConversationStatus] =
    useState<ConversationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // Initialize conversation when user is authenticated
  useEffect(() => {
    if (isAuthenticated && loggedUser) {
      refreshHistory();
      getConversationStatus();
    } else {
      // Reset state when user logs out
      setMessages([]);
      setSessionId(null);
      setConversationStatus(null);
    }
  }, [isAuthenticated, loggedUser]);

  const refreshHistory = async () => {
    if (!loggedUser || !isAuthenticated) return;

    try {
      setError(null);
      const response = await axios.get(`/julius/conversation/history`, {
        headers: getAuthHeaders(),
        params: {
          user_id: loggedUser.id,
          limit: 50,
        },
      });

      if (response.data.success) {
        setMessages(response.data.messages || []);
        setSessionId(response.data.session_id);
      }
    } catch (err: any) {
      console.error("Failed to load conversation history:", err);
      setError("Falha ao carregar histórico da conversa");
    }
  };

  const getConversationStatus = async () => {
    if (!loggedUser || !isAuthenticated) return;

    try {
      const response = await axios.get(`/julius/conversation/status`, {
        headers: getAuthHeaders(),
        params: {
          user_id: loggedUser.id,
        },
      });

      if (response.data.success) {
        setConversationStatus(response.data.conversation);
      }
    } catch (err: any) {
      console.error("Failed to get conversation status:", err);
    }
  };

  const sendMessage = async (question: string) => {
    if (!loggedUser || !isAuthenticated || loading) return;

    setLoading(true);
    setError(null);

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: Date.now(),
      message_type: "user",
      content: question,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await axios.post(
        "/julius/ask",
        {
          question,
          user_id: loggedUser.id,
          session_id: sessionId,
          optimization_level: "aggressive",
        },
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.data.error) {
        throw new Error(response.data.answer || "Erro desconhecido");
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: Date.now() + 1,
        message_type: "assistant",
        content: response.data.answer,
        created_at: new Date().toISOString(),
        query_type: response.data.query_type,
        optimization_level: response.data.optimization_level,
        response_time_ms: response.data.response_time_ms,
        cost_estimate: response.data.cost_estimate,
      };

      setMessages((prev) => [
        ...prev.slice(0, -1),
        tempUserMessage,
        assistantMessage,
      ]);
      setSessionId(response.data.session_id);

      // Update conversation status
      await getConversationStatus();
    } catch (err: any) {
      console.error("Failed to send message:", err);
      setError(
        err.response?.data?.message || err.message || "Falha ao enviar mensagem"
      );

      // Remove the optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = async () => {
    if (!loggedUser || !isAuthenticated) return;

    try {
      setError(null);
      const response = await axios.post(
        "/julius/conversation/clear",
        {
          user_id: loggedUser.id,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.data.success) {
        setMessages([]);
        setSessionId(null);
        setConversationStatus(null);
        await getConversationStatus();
      }
    } catch (err: any) {
      console.error("Failed to clear conversation:", err);
      setError("Falha ao limpar conversa");
    }
  };

  return (
    <JuliusContext.Provider
      value={{
        messages,
        loading,
        sessionId,
        conversationStatus,
        sendMessage,
        clearConversation,
        refreshHistory,
        error,
      }}
    >
      {children}
    </JuliusContext.Provider>
  );
};

export const useJulius = () => useContext(JuliusContext);
