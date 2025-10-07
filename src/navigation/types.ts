export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  AdminHome: undefined;
  Players: undefined;
  PlayerDetail: { playerId: string; displayName: string };
  AddRound: { playerId: string };
  EditRound: { roundId: string };
  Profile: undefined;
};

