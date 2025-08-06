import React from 'react';
import sportsPattern from '../assets/sports.svg';

interface SportsBackgroundProps {
  opacity?: number;
  className?: string;
  animated?: boolean;
}

const SportsBackground: React.FC<SportsBackgroundProps> = ({ 
  opacity = 0.15, 
  className = '',
  animated = true
}) => {
  return (
    <div 
      className={`fixed inset-0 pointer-events-none z-0 ${animated ? 'sports-background' : ''} ${className}`}
      style={{
        backgroundImage: `url(${sportsPattern})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 200px',
        opacity: opacity,
      }}
    />
  );
};

export default SportsBackground;
