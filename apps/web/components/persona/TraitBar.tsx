'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TraitBarProps {
  label: string;
  value: number; // 0-100
  color?: 'blue' | 'purple' | 'red' | 'green' | 'yellow';
}

const colorClasses = {
  blue: 'from-blue-500 to-cyan-500',
  purple: 'from-purple-500 to-pink-500',
  red: 'from-red-500 to-orange-500',
  green: 'from-green-500 to-emerald-500',
  yellow: 'from-yellow-500 to-amber-500',
};

export function TraitBar({ label, value, color = 'purple' }: TraitBarProps) {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400 font-medium">{label}</span>
          <span className="text-xs text-slate-300 font-semibold">{value}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full bg-gradient-to-r rounded-full',
              colorClasses[color]
            )}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}
