import styled, { css } from "styled-components";
import Renda360Logo from "@/assets/renda360_logo.png";

export const StyledWrapper = styled.div<{ $activeEffect?: boolean }>`
  .form-container {
    width: 400px;
    background: linear-gradient(#212121, #212121) padding-box,
      linear-gradient(145deg, transparent 35%, #1ea896, #40c9ff) border-box;
    border: 2px solid transparent;
    padding: 32px 24px;
    font-size: 14px;
    font-family: inherit;
    color: white;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-sizing: border-box;
    border-radius: 16px;
    background-size: 200% 100%;
    animation: gradient 5s ease infinite;

    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }
  .parent-container {
    position: relative;
    background: radial-gradient(circle, #444440 10%, transparent 11%);
    background-size: 1em 1em;
    background-color: rgba(30, 30, 30, 0.8);
    opacity: 1;

    /* Blurred Renda360Logo with on/off logic */
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 0;
      background: url(${Renda360Logo}) 10% 50%/40rem no-repeat;
      pointer-events: none;
      transition: filter 0.4s, opacity 0.4s;

      ${({ $activeEffect }) =>
        $activeEffect
          ? css`
              filter: blur(20px);
              opacity: 1;
            `
          : css`
              filter: blur(8px);
              opacity: 0.4;
            `}
    }

    /* Oscillating light effect */
    &::after {
      content: "";
      position: absolute;
      left: 4%;
      top: 50%;
      transform: translateY(-50%);
      width: 44rem;
      height: 44rem;
      border-radius: 50%;
      z-index: 1;
      pointer-events: none;
      background: radial-gradient(
        circle,
        rgba(146, 208, 215, 0.25) 0%,
        transparent 70%
      );
      transition: opacity 0.4s;
      opacity: 0;
      animation: none;

      ${({ $activeEffect }) =>
        $activeEffect &&
        css`
          animation: oscillate-light 5s ease-in-out infinite;
          opacity: 0.7;
        `}
    }

    > * {
      position: relative;
      z-index: 2;
    }
  }

  @keyframes oscillate-light {
    0% {
      opacity: 0.4;
      filter: blur(24px);
      transform: translateY(-50%) scale(0.95);
    }
    50% {
      opacity: 0.8;
      filter: blur(40px);
      transform: translateY(-50%) scale(1.05);
    }
    100% {
      opacity: 0.4;
      filter: blur(24px);
      transform: translateY(-50%) scale(0.95);
    }
  }

  /* Add this keyframes for the logo blur */
  @keyframes logo-blur-oscillate {
    0% {
      opacity: 0.4;
      filter: blur(8px);
    }
    50% {
      opacity: 1;
      filter: blur(20px);
    }
    100% {
      opacity: 0.4;
      filter: blur(8px);
    }
  }
  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }

    50% {
      background-position: 100% 50%;
    }

    100% {
      background-position: 0% 50%;
    }
  }

  .form-container button:active {
    scale: 0.95;
  }

  .form-container .form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-container .form-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .form-container .form-group label {
    display: block;
    margin-bottom: 5px;
    color: #717171;
    font-weight: 600;
    font-size: 12px;
  }

  .form-container .form-group input {
    width: 100%;
    padding: 12px 16px;
    border-radius: 8px;
    color: #fff;
    font-family: inherit;
    background-color: transparent;
    border: 1px solid #414141;
  }

  .form-container .form-group textarea {
    width: 100%;
    padding: 12px 16px;
    border-radius: 8px;
    resize: none;
    color: #fff;
    height: 96px;
    border: 1px solid #414141;
    background-color: transparent;
    font-family: inherit;
  }

  .form-container .form-group input::placeholder {
    opacity: 0.5;
  }

  .form-container .form-group input:focus {
    outline: none;
    border-color: #1ea896;
  }

  .form-container .form-group textarea:focus {
    outline: none;
    border-color: #1ea896;
  }

  .form-container .form-submit-btn {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    align-self: flex-start;
    font-family: inherit;
    color: #717171;
    font-weight: 600;
    width: 40%;
    background: #313131;
    border: 1px solid #414141;
    padding: 12px 16px;
    font-size: inherit;
    gap: 8px;
    margin-top: 8px;
    cursor: pointer;
    border-radius: 6px;
  }

  .form-container .form-submit-btn:hover {
    background-color: #1ea896;
    color: #fff;
  }
`;
