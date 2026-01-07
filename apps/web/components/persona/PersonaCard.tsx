'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap, Trophy, Coins } from 'lucide-react';
import { Persona, PersonaTier } from '@ai-xandria/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FloatingParticles } from './FloatingParticles';
import { TierBadge } from './TierBadge';
import { TraitBar } from './TraitBar';

interface PersonaCardProps {
  persona: Persona;
  showStats?: boolean;
  onRent?: () => void;
  onBattle?: () => void;
  onTrade?: () => void;
  className?: string;
}

export function PersonaCard({
  persona,
  showStats = true,
  onRent,
  onBattle,
  onTrade,
  className,
}: PersonaCardProps) {
  const { tier } = persona;

  return (
    <motion.div
      className={cn('persona-card', className)}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Card Border with Tier-specific Styling */}
      <div className={cn('card-border', `tier-${tier}`)}>
        {/* Floating Particles for Legendary */}
        {tier === 'legendary' && <FloatingParticles count={8} />}

        {/* Avatar Section */}
        <div className="card-avatar relative w-full aspect-square rounded-lg overflow-hidden mb-4 bg-gradient-to-br from-slate-800 to-slate-900">
          <img
            src={persona.avatarUrl}
            alt={persona.name}
            className="w-full h-full object-cover"
          />
          
          {/* Tier Icon Overlay */}
          {tier === 'legendary' && (
            <motion.div
              className="absolute top-3 right-3"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Sparkles className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            </motion.div>
          )}
          
          {tier === 'epic' && (
            <div className="absolute top-3 right-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
          )}
        </div>

        {/* Header: Name + Tier Badge */}
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="text-2xl font-bold text-white truncate flex-1">
            {persona.name}
          </h3>
          <TierBadge tier={tier} />
        </div>

        {/* Tagline */}
        {persona.tagline && (
          <p className="text-sm text-slate-400 mb-3 line-clamp-2">
            {persona.tagline}
          </p>
        )}

        {/* Mint Address */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-4">
          <span>
            #{persona.mintAddress.slice(0, 4)}...{persona.mintAddress.slice(-4)}
          </span>
          {persona.isWounded && (
            <span className="text-red-400 font-semibold">⚠️ WOUNDED</span>
          )}
        </div>

        {/* Owner & Creator */}
        <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 mb-1">Owner</span>
            <span className="text-sm text-slate-300 font-mono truncate">
              {truncateAddress(persona.owner)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 mb-1">Creator</span>
            <span className="text-sm text-slate-300 font-mono truncate">
              {truncateAddress(persona.creator)}
            </span>
          </div>
        </div>

        {/* Skills & Traits */}
        {showStats && (
          <>
            <div className="mb-4 p-3 bg-slate-800/20 rounded-lg border border-slate-700/30">
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                Skills & Traits
              </h4>
              <div className="space-y-2">
                <TraitBar 
                  label="Intelligence" 
                  value={persona.traits.intelligence} 
                  color="blue"
                />
                <TraitBar 
                  label="Creativity" 
                  value={persona.traits.creativity} 
                  color="purple"
                />
                <TraitBar 
                  label="Persuasion" 
                  value={persona.traits.persuasion} 
                  color="red"
                />
                <TraitBar 
                  label="Empathy" 
                  value={persona.traits.empathy} 
                  color="green"
                />
              </div>
            </div>

            {/* Performance Stats */}
            <div className="mb-4 p-3 bg-slate-800/20 rounded-lg border border-slate-700/30">
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                Performance
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <StatItem
                  label="Battles"
                  value={`${persona.battlesWon}W / ${persona.battlesLost}L`}
                  icon="⚔️"
                />
                <StatItem
                  label="Rating"
                  value={persona.eloRating.toLocaleString()}
                  icon="⭐"
                />
                <StatItem
                  label="Chats"
                  value={persona.totalChats.toLocaleString()}
                  icon="💬"
                />
                <StatItem
                  label="Revenue"
                  value={`${persona.totalRevenue.toFixed(2)} ◎`}
                  icon="💰"
                />
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {onRent && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={onRent}
            >
              <Coins className="w-4 h-4 mr-1" />
              Rent
            </Button>
          )}
          {onBattle && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={onBattle}
              disabled={persona.isWounded}
            >
              ⚔️ Battle
            </Button>
          )}
          {onTrade && (
            <Button
              variant="default"
              size="sm"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={onTrade}
            >
              Trade
            </Button>
          )}
        </div>

        {/* Listing Price Badge (if listed) */}
        {persona.isListed && persona.listingPrice && (
          <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded text-center">
            <span className="text-xs text-green-400 font-semibold">
              FOR SALE: {persona.listingPrice.toFixed(2)} ◎
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Helper Components

function StatItem({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: string; 
  icon: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500 mb-1">
        {icon} {label}
      </span>
      <span className="text-sm font-semibold text-slate-200">
        {value}
      </span>
    </div>
  );
}

function truncateAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
