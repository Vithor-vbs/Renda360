import React, { useState, useRef, useEffect } from "react";
import { VscSend } from "react-icons/vsc";
import {
  MdAutoAwesome,
  MdClose,
  MdMinimize,
  MdDelete,
  MdRefresh,
} from "react-icons/md";
import { useJulius } from "../../context/JuliusContext";
import { useAuth } from "../../context/AuthContext";
import "./JuliusDialog.css";

interface JuliusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
}

export const JuliusDialog: React.FC<JuliusDialogProps> = ({
  isOpen,
  onClose,
  onMinimize,
}) => {
  const { isAuthenticated } = useAuth();
  const {
    messages,
    loading,
    sendMessage,
    clearConversation,
    refreshHistory,
    error,
    conversationStatus,
  } = useJulius();

  const [inputMessage, setInputMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isOpen) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputMessage, isOpen]);

  // Focus textarea when dialog opens
  useEffect(() => {
    if (isOpen && textareaRef.current && isAuthenticated) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, isAuthenticated]);

  // Auto-scroll when dialog opens and has messages
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen, messages.length]);

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="julius-dialog-backdrop" onClick={onClose} />

      {/* Dialog */}
      <div className="julius-dialog">
        {/* Header */}
        <div className="julius-dialog-header">
          <div className="julius-dialog-title">
            <span className="julius-icon">
              <MdAutoAwesome size={20} />
            </span>
            <div>
              <h3>Julius IA</h3>
              {conversationStatus && (
                <span className="message-count">
                  {conversationStatus.total_messages} mensagens
                </span>
              )}
            </div>
          </div>

          <div className="julius-dialog-controls">
            <button
              className={`control-button refresh ${loading ? "spinning" : ""}`}
              onClick={refreshHistory}
              disabled={loading}
              title="Atualizar conversa"
            >
              <MdRefresh size={16} />
            </button>
            {messages.length > 0 && (
              <button
                className="control-button clear"
                onClick={handleClearConversation}
                disabled={loading}
                title="Limpar conversa"
              >
                <MdDelete size={16} />
              </button>
            )}
            {/* {onMinimize && (
              <button
                className="control-button minimize"
                onClick={onMinimize}
                title="Minimizar"
              >
                <MdMinimize size={16} />
              </button>
            )} */}
            <button
              className="control-button close"
              onClick={onClose}
              title="Fechar"
            >
              <MdClose size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="julius-dialog-content">
          {!isAuthenticated ? (
            <div className="chat-welcome">
              Faça login para conversar com Julius IA
            </div>
          ) : (
            <>
              {error && <div className="chat-error">{error}</div>}

              {messages.length === 0 && !error && (
                <div className="chat-welcome">
                  <div className="welcome-icon">
                    <MdAutoAwesome size={40} />
                  </div>
                  <h4>Olá! Sou Julius 👋</h4>
                  <p>Seu assistente financeiro pessoal</p>
                  <div className="welcome-examples">
                    <p>Experimente perguntar:</p>
                    <div className="example-questions">
                      <button
                        onClick={() =>
                          setInputMessage("Quais meus maiores gastos?")
                        }
                      >
                        💰 "Quais meus maiores gastos?"
                      </button>
                      <button
                        onClick={() =>
                          setInputMessage("Quanto gastei este mês?")
                        }
                      >
                        📊 "Quanto gastei este mês?"
                      </button>
                      <button
                        onClick={() => setInputMessage("Últimas transações")}
                      >
                        🔍 "Últimas transações"
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message, index) => renderMessage(message, index))}

              {loading && renderLoadingMessage()}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {isAuthenticated && (
          <div className="julius-dialog-footer">
            <div className="input-container">
              <textarea
                ref={textareaRef}
                className="julius-textarea"
                placeholder="Digite sua pergunta sobre finanças..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                rows={1}
              />
              <button
                className="send-button"
                onClick={handleSendMessage}
                disabled={loading || !inputMessage.trim()}
              >
                <VscSend size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
