// src/types.ts

// --- Dominio ---
export type Role = 'admin' | 'player';

export interface Profile {
  user_id: string;
  club_id: string | null;
  display_name: string;
  role: Role;
}

export interface Round {
  id: string;
  player_id: string;
  played_at: string; 
  course_name: string;
  course_rating: number;
  course_slope: number;
  course_par: number;
  pcc: number;
  adjusted_score: number;
  score_differential: number;
}

// Navegación
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  
  // CORRECCIÓN: Usamos el nombre exacto del componente para evitar confusiones
  AdminHomeScreen: undefined; 
  
  Players: undefined;
  PlayerDetail: { playerId: string; displayName: string };
  AddRound: { playerId: string };
  EditRound: { roundId: string };
  Profile: undefined;
  Ranking: undefined;
};