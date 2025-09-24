import React, { useState, useRef, useEffect } from "react";
import "./SidebarChat.css";
import { VscSend } from "react-icons/vsc";
import { MdAutoAwesome, MdClear } from "react-icons/md";
import { useJulius } from "../../context/JuliusContext";
import { useAuth } from "../../context/AuthContext";

export const SidebarChat: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const {
    messages,
    loading,
    sendMessage,
    clearConversation,
    error,
    conversationStatus,
  } = useJulius();

  const [inputMessage, setInputMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading || !isAuthenticated) return;

    const message = inputMessage.trim();
    setInputMessage("");

    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearConversation = async () => {
    if (window.confirm("Tem certeza que deseja limpar toda a conversa?")) {
      await clearConversation();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = (message: any, index: number) => (
    <div
      key={`${message.id || index}-${message.created_at}`}
      className={`chat-message ${message.message_type}`}
    >
      <p className="chat-message-content">{message.content}</p>
      <div className="chat-message-meta">
        <span>{formatTimestamp(message.created_at)}</span>
        {message.message_type === "assistant" && message.response_time_ms && (
          <span>{message.response_time_ms}ms</span>
        )}
        {message.message_type === "assistant" && message.query_type && (
          <span>{message.query_type}</span>
        )}
      </div>
    </div>
  );

  const renderLoadingMessage = () => (
    <div className="chat-loading">
      <span>Julius está pensando</span>
      <div className="loading-dots">
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="sidebarchat-column">
        <div className="sidebarchat-header">
          <h2 className="sidebarchat-title">
            <span style={{ color: "#1ea896" }}>
              <MdAutoAwesome size={22} />
            </span>
            Julius IA
          </h2>
        </div>
        <div className="sidebarchat-content">
          <div className="chat-welcome">
            Faça login para conversar com Julius IA
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebarchat-column">
      <div className="sidebarchat-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 className="sidebarchat-title">
            <span style={{ color: "#1ea896" }}>
              <MdAutoAwesome size={22} />
            </span>
            Julius IA
          </h2>
          {messages.length > 0 && (
            <button
              className="clear-conversation"
              onClick={handleClearConversation}
              disabled={loading}
              title="Limpar conversa"
            >
              <MdClear size={14} />
            </button>
          )}
        </div>
        {conversationStatus && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "#b0b3b8",
              marginTop: "0.25rem",
            }}
          >
            {conversationStatus.total_messages} mensagens
          </div>
        )}
      </div>

      <div className="sidebarchat-content">
        {error && <div className="chat-error">{error}</div>}

        {messages.length === 0 && !loading && !error && (
          <div className="chat-welcome">
            Olá! Sou Julius, seu assistente financeiro.
            <br />
            <br />
            Pergunte sobre seus gastos, transações ou análises financeiras.
            <br />
            <br />
            Exemplos:
            <br />• "Quais meus maiores gastos?"
            <br />• "Quanto gastei este mês?"
            <br />• "Últimas transações"
          </div>
        )}

        {messages.map((message, index) => renderMessage(message, index))}

        {loading && renderLoadingMessage()}

        <div ref={messagesEndRef} />
      </div>

      <div className="sidebarchat-footer">
        <textarea
          ref={textareaRef}
          className="sidebarchat-textarea"
          placeholder="Digite sua pergunta sobre finanças..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading || !isAuthenticated}
          rows={1}
        />
        <button
          className="sendButton"
          onClick={handleSendMessage}
          disabled={loading || !inputMessage.trim() || !isAuthenticated}
        >
          <VscSend size={18} />
        </button>
      </div>
    </div>
  );
};
