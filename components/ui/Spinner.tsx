import React from 'react';

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap: Record<Required<SpinnerProps>['size'], number> = {
  sm: 16,
  md: 24,
  lg: 32,
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  const dimension = sizeMap[size];

  return (
    <svg
      className="spinner"
      width={dimension}
      height={dimension}
      viewBox="0 0 50 50"
      role="status"
      aria-label="Carregando"
    >
      <circle
        className="spinner-path"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
};

