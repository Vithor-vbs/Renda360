import React from "react";
import "./SidebarChat.css";
import { VscSend } from "react-icons/vsc";
import { MdAutoAwesome } from "react-icons/md";

export const SidebarChat: React.FC = () => (
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
      <p className="sidebarchat-label">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </p>
      <p className="sidebarchat-label">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </p>
      <p className="sidebarchat-label">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </p>
    </div>
    <div className="sidebarchat-footer">
      <textarea
        className="sidebarchat-textarea"
        placeholder="Type your message..."
      ></textarea>
      <button className="sendButton">
        <VscSend size={18} />
      </button>
    </div>
  </div>
);
