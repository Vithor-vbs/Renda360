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
  const [isInitialized, setIsInitialized] = useState(false);
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
    if (isAuthenticated && loggedUser && !isInitialized) {
      setIsInitialized(true);
      refreshHistory();
      getConversationStatus();
    } else if (!isAuthenticated) {
      // Reset state when user logs out
      setMessages([]);
      setSessionId(null);
      setConversationStatus(null);
      setLoading(false);
      setIsInitialized(false);
    }
  }, [isAuthenticated, loggedUser, isInitialized]);

  const refreshHistory = async () => {
    if (!loggedUser || !isAuthenticated) {
      console.log(
        "Cannot refresh history: user not authenticated or logged in"
      );
      return;
    }

    console.log("Refreshing conversation history for user:", loggedUser.id);

    // Set a timeout to prevent loading state from getting stuck
    const timeoutId = setTimeout(() => {
      console.warn("History loading timeout - forcing loading state to false");
      setLoading(false);
    }, 10000); // 10 second timeout

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/julius/conversation/history`, {
        headers: getAuthHeaders(),
        params: {
          user_id: loggedUser.id,
          limit: 50,
        },
      });

      clearTimeout(timeoutId); // Clear timeout on successful response

      console.log("Conversation history response:", response.data);

      if (response.data.success) {
        const messages = response.data.messages || [];
        setMessages(messages);
        setSessionId(response.data.session_id || null);
        console.log("Loaded", messages.length, "messages from history");
      } else {
        console.log("History request unsuccessful:", response.data);
        setMessages([]); // Ensure we set empty messages on failure
        setSessionId(null);
      }
    } catch (err: any) {
      clearTimeout(timeoutId); // Clear timeout on error
      console.error("Failed to load conversation history:", err);
      setError("Falha ao carregar histórico da conversa");
      setMessages([]); // Ensure we set empty messages on error
    } finally {
      setLoading(false);
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

    // Set a timeout to prevent loading state from getting stuck
    const timeoutId = setTimeout(() => {
      console.warn("Message sending timeout - forcing loading state to false");
      setLoading(false);
    }, 30000); // 30 second timeout for AI responses

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

      clearTimeout(timeoutId); // Clear timeout on successful response

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
      clearTimeout(timeoutId); // Clear timeout on error
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
