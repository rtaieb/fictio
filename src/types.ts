export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  hasSubmitted?: boolean;
  hasVoted?: boolean;
  votedFor?: string | null;
  avatarColor?: string; // e.g. bg-primary, bg-secondary
}

export interface Proposition {
  playerId: string; // ID du joueur ou 'true_answer'
  text: string;
  voters: string[]; // Liste des IDs de joueurs ayant voté pour cette prop
  isEmpty?: boolean;
};

export type Room = {
  id: string;
  createdAt: number;
  state: 'lobby' | 'playing' | 'results';
  currentRound: number;
  maxRounds: number;
  bluffTimeLimit?: number;
  voteTimeLimit?: number;
  hostId: string;
  
  // Game state
  phase?: 'bluffing' | 'voting' | 'revealing';
  phaseEndsAt?: number; // timestamp in ms for the 20s timer
  question?: {
    text: string;
    trueAnswer: string;
    type: 'word' | 'question';
  };
  propositions?: Proposition[];
  readyPlayers?: string[]; // array of playerIds ready for next round
};
