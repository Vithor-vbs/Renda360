import React, { useState, useEffect } from "react";
import { FloatingAIButton } from "../FloatingAIButton/FloatingAIButton";
import { JuliusDialog } from "../JuliusDialog/JuliusDialog";
import { useJulius } from "../../context/JuliusContext";

export const JuliusAIManager: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { messages } = useJulius();

  // Check if there are new messages when dialog is closed
  const [lastSeenMessageCount, setLastSeenMessageCount] = useState(0);
  const hasUnreadMessages =
    messages.length > lastSeenMessageCount && !isDialogOpen;

  useEffect(() => {
    if (isDialogOpen) {
      setLastSeenMessageCount(messages.length);
    }
  }, [isDialogOpen, messages.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + J to toggle Julius AI
      if ((event.ctrlKey || event.metaKey) && event.key === "j") {
        event.preventDefault();
        if (isDialogOpen) {
          handleCloseDialog();
        } else {
          handleOpenDialog();
        }
      }
      // Escape to close dialog
      else if (event.key === "Escape" && isDialogOpen) {
        handleCloseDialog();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isDialogOpen]);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setLastSeenMessageCount(messages.length);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setLastSeenMessageCount(messages.length);
  };

  const handleMinimizeDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <FloatingAIButton
        onClick={isDialogOpen ? handleCloseDialog : handleOpenDialog}
        hasUnreadMessages={hasUnreadMessages}
        isOpen={isDialogOpen}
      />

      <JuliusDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onMinimize={handleMinimizeDialog}
      />
    </>
  );
};
