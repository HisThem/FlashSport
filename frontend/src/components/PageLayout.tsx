import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  className = '', 
  containerClassName = '' 
}) => {
  return (
    <div className={`min-h-[calc(100vh-4rem)] pt-4 relative z-10 ${className}`}>
      <div className={`container mx-auto px-4 py-8 ${containerClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
