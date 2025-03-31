import React from "react";
import Microphone from "./icons/Microphone";
import Recording from "./icons/Recording";

const TranscriptButton = ({ className, onClick, isTranscribing, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`scl-key-list__button govuk-button scl-button--record scl-button--recording-${
      isTranscribing ? "active" : "paused"
    } ${className}`}
  >
    <span className="scl-button__microphone">
      <Microphone />
    </span>
    <span className="scl-button__recording-animation">
      <Recording />
    </span>
  </button>
);

export default TranscriptButton;
