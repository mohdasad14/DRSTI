import React from 'react';

interface DrstiLogoProps {
  className?: string;
  size?: number;
}

export const DrstiLogo: React.FC<DrstiLogoProps> = ({ className = 'w-7 h-7', size = 28 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="DRSTI Logo"
    >
      {/* Outer shield structure */}
      <path
        d="M16 3.5L6.5 7.2V14.2C6.5 20.2 10.5 25.8 16 27.8C21.5 25.8 25.5 20.2 25.5 14.2V7.2L16 3.5Z"
        stroke="#3B82F6"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="fill-blue-500/10"
      />
      {/* Intelligent pulse / telemetry wave */}
      <path
        d="M10 16H12.8L14.6 11.8L17.4 20.2L19.2 16H22"
        stroke="#60A5FA"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ambient center radar node */}
      <circle cx="16" cy="16" r="1.2" fill="#93C5FD" />
    </svg>
  );
};
