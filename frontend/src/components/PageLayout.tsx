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
    <div className={`min-h-[calc(100vh-4rem)] bg-base-100 pt-4 ${className}`}>
      <div className={`container mx-auto px-4 py-8 ${containerClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
