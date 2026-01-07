/**
 * Shared Types Package
 * @package @ai-xandria/types
 */

// ==========================================
// Persona Types
// ==========================================

export type PersonaTier = 'common' | 'rare' | 'epic' | 'legendary';

export interface PersonaTraits {
  intelligence: number;   // 0-100
  creativity: number;     // 0-100
  persuasion: number;     // 0-100
  empathy: number;        // 0-100
  technical: number;      // 0-100
}

export interface Persona {
  id: string;
  mintAddress: string;
  walletPDA: string;
  
  // Basic Info
  name: string;
  category: string;
  tagline: string;
  description: string;
  
  // Traits
  traits: PersonaTraits;
  skills: string[];
  
  // Visual
  avatarUrl: string;
  tier: PersonaTier;
  
  // Ownership
  owner: string;          // wallet address
  creator: string;        // wallet address
  
  // Performance
  battlesWon: number;
  battlesLost: number;
  eloRating: number;
  totalChats: number;
  totalRevenue: number;   // in SOL
  
  // Battle State
  isWounded: boolean;
  woundedUntil?: Date;
  
  // Marketplace
  isListed: boolean;
  listingPrice?: number;
  
  // Generation Metadata
  promptText: string;
  promptScore?: {
    specificity: number;
    creativity: number;
    coherence: number;
    complexity: number;
    total: number;
  };
  generationCost?: number; // in USD
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePersonaInput {
  prompt: string;
  walletAddress: string;
}

export interface UpdatePersonaInput {
  tagline?: string;
  description?: string;
}

// ==========================================
// Battle Types
// ==========================================

export type BattleMode = 'casual' | 'ranked' | 'deathmatch';
export type BattleStatus = 'pending' | 'arguing' | 'judging' | 'completed' | 'cancelled';

export interface Battle {
  id: string;
  
  // Configuration
  mode: BattleMode;
  topic: string;
  entryFee: number;
  
  // Participants
  persona1Id: string;
  persona2Id: string;
  persona1?: Persona;
  persona2?: Persona;
  
  // Arguments
  persona1Argument?: string;
  persona2Argument?: string;
  
  // Results
  winnerId?: string;
  judgeResult?: {
    winner: 'persona1' | 'persona2';
    scores: {
      persona1: PersonaScore;
      persona2: PersonaScore;
    };
    reasoning: string;
    highlights: {
      persona1_best: string;
      persona2_best: string;
    };
    improvement_suggestions: {
      persona1: string;
      persona2: string;
    };
  };
  
  // Rewards
  winnerReward?: number;
  loserConsequence?: 'none' | 'wounded' | 'burned';
  
  // Status
  status: BattleStatus;
  
  // Timestamps
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface PersonaScore {
  logical_coherence: number;
  creativity: number;
  persuasiveness: number;
  topic_relevance: number;
  total: number;
}

export interface CreateBattleInput {
  mode: BattleMode;
  persona1Id: string;
  persona2Id: string;
  topic?: string;
  creatorWallet: string;
}

// ==========================================
// Marketplace Types
// ==========================================

export type ListingStatus = 'active' | 'sold' | 'cancelled';

export interface MarketplaceListing {
  id: string;
  personaId: string;
  persona?: Persona;
  
  // Pricing
  price: number;  // in SOL
  
  // Seller
  sellerWallet: string;
  
  // Status
  status: ListingStatus;
  
  // Timestamps
  listedAt: Date;
  soldAt?: Date;
  cancelledAt?: Date;
}

export interface CreateListingInput {
  personaId: string;
  price: number;
  sellerWallet: string;
}

export interface BuyListingInput {
  listingId: string;
  buyerWallet: string;
}

// ==========================================
// Wallet Types
// ==========================================

export interface PersonaWallet {
  address: string;
  personaId: string;
  owner: string;
  creator: string;
  
  // Balances (in SOL)
  currentBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  
  // Earnings Breakdown (in SOL)
  earnings: {
    total: number;
    battle: number;
    marketplace: number;
    chat: number;
    tip: number;
  };
  
  // Timestamps
  createdAt: Date;
  lastActivity: Date;
}

export interface WalletTransaction {
  id: string;
  personaId: string;
  walletPDA: string;
  
  // Transaction Details
  type: 'deposit' | 'withdrawal';
  earningType?: 'battle' | 'marketplace' | 'chat' | 'tip';
  amount: number;  // in SOL
  
  // Related Entities
  relatedBattleId?: string;
  relatedListingId?: string;
  
  // Blockchain
  txSignature?: string;
  
  // Timestamp
  createdAt: Date;
}

// ==========================================
// User Types
// ==========================================

export interface User {
  walletAddress: string;
  
  // Profile
  username?: string;
  avatarUrl?: string;
  bio?: string;
  
  // Stats
  personasCreated: number;
  personasOwned: number;
  battlesParticipated: number;
  battlesWon: number;
  totalSpent: number;   // in SOL
  totalEarned: number;  // in SOL
  
  // Settings
  email?: string;
  notificationPreferences?: {
    battleResults: boolean;
    marketplaceSales: boolean;
    newFollowers: boolean;
  };
  
  // Timestamps
  createdAt: Date;
  lastActive: Date;
}

// ==========================================
// API Response Types
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ==========================================
// Filter & Sort Types
// ==========================================

export interface PersonaFilters {
  owner?: string;
  creator?: string;
  tier?: PersonaTier[];
  minRating?: number;
  maxRating?: number;
  isListed?: boolean;
  category?: string;
}

export interface PersonaSortOptions {
  sortBy?: 'rating' | 'created' | 'revenue' | 'battles';
  order?: 'asc' | 'desc';
}

export interface BattleFilters {
  mode?: BattleMode;
  personaId?: string;
  status?: BattleStatus;
}

export interface MarketplaceFilters {
  tier?: PersonaTier[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  category?: string;
}

export interface MarketplaceSortOptions {
  sortBy?: 'price' | 'rating' | 'created';
  order?: 'asc' | 'desc';
}

// ==========================================
// Cost Types
// ==========================================

export interface MintCost {
  promptEvaluation: number;
  textGeneration: number;
  imageGeneration: number;
  solanaRent: number;
  transactionFee: number;
  platformFee: number;
  subtotal: number;
  total: number;
  totalSOL: number;
  solPriceUSD: number;
}

// ==========================================
// WebSocket Event Types
// ==========================================

export type WebSocketEventType = 
  | 'battle_started'
  | 'battle_argument_submitted'
  | 'battle_completed'
  | 'persona_minted'
  | 'persona_listed'
  | 'persona_sold';

export interface WebSocketEvent<T = any> {
  type: WebSocketEventType;
  payload: T;
  timestamp: Date;
}
