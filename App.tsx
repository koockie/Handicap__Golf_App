// App.tsx (raíz)
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './src/supabase';
import { colors } from './src/theme';

import LoginScreen from './src/screens/LoginScreen';
import AdminHomeScreen from './src/screens/AdminHomeScreen';
import PlayersScreen from './src/screens/PlayersScreen';
import PlayerDetailScreen from './src/screens/PlayerDetailScreen';
import AddRoundModal from './src/screens/AddRoundModal';
import ProfileScreen from './src/screens/ProfileScreen';
import EditRoundModal from './src/screens/EditRoundModal';

export type RootStackParamList = {
  Login: undefined;
  AdminHome: undefined;
  Players: undefined;
  PlayerDetail: { playerId: string; displayName: string };
  AddRound: { playerId: string };
  EditRound: { roundId: string };   // 👈 FALTABA ESTA LÍNEA
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'player' | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      if (!session) { setRole(null); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setRole(null); return; }
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!error && data) setRole(data.role as any);
    })();
  }, [session]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.dark },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        {!session ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : role === 'admin' ? (
          <>
            <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'Administrador' }} />
            <Stack.Screen name="Players" component={PlayersScreen} options={{ title: 'Jugadores' }} />
            <Stack.Screen
              name="PlayerDetail"
              component={PlayerDetailScreen}
              options={({ route }) => ({ title: route.params.displayName })}
            />
            <Stack.Screen name="AddRound" component={AddRoundModal} options={{ title: 'Agregar tarjeta' }} />
            <Stack.Screen name="EditRound" component={EditRoundModal} options={{ title: 'Editar tarjeta' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Players" component={PlayersScreen} options={{ title: 'Jugadores' }} />
            <Stack.Screen
              name="PlayerDetail"
              component={PlayerDetailScreen}
              options={({ route }) => ({ title: route.params.displayName })}
            />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mi perfil' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
