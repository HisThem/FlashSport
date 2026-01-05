import React, { ReactNode } from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
  icon?: ReactNode;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onClick, 
  label = '发布活动',
  icon
}) => {
  return (
    <button
      className="group fixed bottom-6 right-6 md:bottom-8 md:right-8 h-14 w-14 hover:w-[125px] flex items-center justify-start pl-[16px] hover:pl-4 overflow-hidden bg-primary text-primary-content rounded-full hover:rounded-[28px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary z-40 active:scale-95 shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out"
      onClick={onClick}
    >
      {icon || (
        <svg 
          className="w-6 h-6 flex-shrink-0"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2.5}
            d="M12 4v16m8-8H4" 
          />
        </svg>
      )}
      <span className="ml-2 font-semibold whitespace-nowrap text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {label}
      </span>
    </button>
  );
};

export default FloatingActionButton;
