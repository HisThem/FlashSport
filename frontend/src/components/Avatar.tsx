import React from 'react';

interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: 'tiny' | 'small' | 'medium' | 'large';
}

const sizeClasses = {
  tiny: 'w-8 h-8',
  small: 'w-12 h-12',
  medium: 'w-16 h-16',
  large: 'w-24 h-24',
};

const textSizeClasses = {
    tiny: 'text-sm',
    small: 'text-xl',
    medium: 'text-3xl',
    large: 'text-5xl',
}

const backgroundColors = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-lime-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-rose-500',
];

const Avatar: React.FC<AvatarProps> = ({ username, avatarUrl, size = 'medium' }) => {
  const firstChar = username ? username.charAt(0).toUpperCase() : '?';
  const containerSize = sizeClasses[size];
  const textSize = textSizeClasses[size];
  
  // 基于用户名生成固定的颜色索引
  const getBackgroundColor = (username: string) => {
    if (!username) return 'bg-neutral';
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % backgroundColors.length;
    return backgroundColors[index];
  };

  const backgroundColor = avatarUrl ? 'bg-neutral' : getBackgroundColor(username);

  return (
    <div className={`avatar ${!avatarUrl ? 'avatar-placeholder' : ''}`}>
      <div className={`${backgroundColor} text-white rounded-full ${containerSize} flex items-center justify-center`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={`${username}'s avatar`} className="w-full h-full object-cover rounded-full" />
        ) : (
          <span className={`${textSize} font-semibold`}>{firstChar}</span>
        )}
      </div>
    </div>
  );
};

export default Avatar;
