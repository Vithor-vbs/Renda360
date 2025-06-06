import React from "react";
import "./Goals.css";

export const Goals: React.FC = () => {
  return (
    <div className="container">
      <div className="goals-header">
        <h2 className="goals-title">Metas</h2>
        <p className="goals-description">
          Mostra o progresso de metas definidas.
        </p>
      </div>
      <div className="skill-box">
        <span className="title">Economizar em Utilidade - R$ 200</span>
        <div className="skill-bar">
          <span className="skill-per utilidade" style={{ background: "#008236" }}>
            <span className="tooltip">70%</span>
          </span>
        </div>
      </div>

      <div className="skill-box">
        <span className="title">Economizar em Alimentação - R$ 300</span>
        <div className="skill-bar">
          <span className="skill-per alimentacao" style={{ background: "#6E11B0" }}>
            <span className="tooltip">80%</span>
          </span>
        </div>
      </div>

      <div className="skill-box">
        <span className="title">Economizar em Transporte - R$ 150</span>
        <div className="skill-bar">
          <span className="skill-per transporte" style={{ background: "#7BF1A8" }}>
            <span className="tooltip">50%</span>
          </span>
        </div>
      </div>

      <div className="skill-box">
        <span className="title">Economizar em Aluguel - R$ 400</span>
        <div className="skill-bar">
          <span className="skill-per aluguel" style={{ background: "#5EF72D" }}>
            <span className="tooltip">85%</span>
          </span>
        </div>
      </div>
    </div>
  );
};