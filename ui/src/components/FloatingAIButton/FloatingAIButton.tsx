import React from "react";
import { MdAutoAwesome } from "react-icons/md";
import "./FloatingAIButton.css";

interface FloatingAIButtonProps {
  onClick: () => void;
  hasUnreadMessages?: boolean;
  isOpen?: boolean;
}

export const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({
  onClick,
  hasUnreadMessages = false,
  isOpen = false,
}) => {
  return (
    <button
      className={`floating-ai-button ${isOpen ? "open" : ""}`}
      onClick={onClick}
      title={
        isOpen ? "Fechar Julius IA (Esc)" : "Conversar com Julius IA (Ctrl+J)"
      }
    >
      <MdAutoAwesome size={24} />
      {hasUnreadMessages && <div className="unread-indicator" />}
      {isOpen && <div className="close-indicator">×</div>}
    </button>
  );
};
