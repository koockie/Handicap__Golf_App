export type Role = 'admin' | 'player';
export interface Profile { user_id:string; club_id:string|null; display_name:string; role:Role; }
export interface Round {
  id:string; player_id:string; played_at:string;
  course_name:string; course_rating:number; course_slope:number; course_par:number;
  pcc:number; adjusted_score:number; score_differential:number;
}
