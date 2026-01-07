'use client';

import { PersonaTier } from '@ai-xandria/types';
import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: PersonaTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const tierConfig = {
  common: {
    label: 'Common',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/50',
    textColor: 'text-gray-300',
    icon: '⚪',
  },
  rare: {
    label: 'Rare',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-300',
    icon: '🔵',
  },
  epic: {
    label: 'Epic',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/50',
    textColor: 'text-purple-300',
    icon: '🟣',
  },
  legendary: {
    label: 'Legendary',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
    textColor: 'text-yellow-300',
    icon: '🟡',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export function TierBadge({ 
  tier, 
  size = 'md',
  showLabel = true
}: TierBadgeProps) {
  const config = tierConfig[tier];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        config.bgColor,
        config.borderColor,
        config.textColor,
        sizeClasses[size]
      )}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}
