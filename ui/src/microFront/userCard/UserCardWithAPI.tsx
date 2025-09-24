import React from "react";
import "./userCard.css";
import { useAuth } from "../../context/AuthContext";

const UserCardWithAPI: React.FC = () => {
  const { loggedUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="usercard-wrapper">
        <div className="card-client loading">
          <div className="user-picture skeleton">
            <div className="skeleton-circle"></div>
          </div>
          <div className="skeleton-text"></div>
        </div>
      </div>
    );
  }

  if (!loggedUser) {
    return (
      <div className="usercard-wrapper">
        <div className="card-client">
          <div className="user-picture">
            <svg
              viewBox="0 0 448 512"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M224 256c70.7 0 128-57.31 128-128s-57.3-128-128-128C153.3 0 96 57.31 96 128S153.3 256 224 256zM274.7 304H173.3C77.61 304 0 381.6 0 477.3c0 19.14 15.52 34.67 34.66 34.67h378.7C432.5 512 448 496.5 448 477.3C448 381.6 370.4 304 274.7 304z" />
            </svg>
          </div>
          <p className="name-client">Usuário não conectado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="usercard-wrapper">
      <div className="card-client">
        <div className="user-picture">
          <svg
            viewBox="0 0 448 512"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M224 256c70.7 0 128-57.31 128-128s-57.3-128-128-128C153.3 0 96 57.31 96 128S153.3 256 224 256zM274.7 304H173.3C77.61 304 0 381.6 0 477.3c0 19.14 15.52 34.67 34.66 34.67h378.7C432.5 512 448 496.5 448 477.3C448 381.6 370.4 304 274.7 304z" />
          </svg>
        </div>

        <p className="name-client">
          {loggedUser.username}
          <span>{loggedUser.email}</span>
        </p>
      </div>
    </div>
  );
};

export default UserCardWithAPI;
