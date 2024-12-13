import React from 'react';

const SentimentGauge = ({ score }) => (
  <div className="relative w-32 h-32">
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-3xl font-bold text-foreground">{score}%</span>
    </div>
    <svg className="transform -rotate-90 w-32 h-32">
      <circle
        cx="64"
        cy="64"
        r="60"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        className="text-muted"
      />
      <circle
        cx="64"
        cy="64"
        r="60"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        className="text-primary"
        strokeDasharray={`${2 * Math.PI * 60 * score / 100} ${2 * Math.PI * 60}`}
      />
    </svg>
  </div>
);

export default SentimentGauge;