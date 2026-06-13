export type Player = {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  hasSubmitted?: boolean;
  hasVoted?: boolean;
  avatarColor?: string; // e.g. bg-primary, bg-secondary
};

export type Proposition = {
  playerId: string; // 'true_answer' for the real one
  text: string;
  voters: string[]; // array of playerIds
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
