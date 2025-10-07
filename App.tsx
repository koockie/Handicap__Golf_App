// App.tsx (raíz)
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './src/supabase';
import { colors } from './src/theme';

// Tipos de rutas centralizados
import { RootStackParamList } from './src/types';

// Pantallas
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';  
import AdminHomeScreen from './src/screens/AdminHomeScreen';
import PlayersScreen from './src/screens/PlayersScreen';
import PlayerDetailScreen from './src/screens/PlayerDetailScreen';
import AddRoundModal from './src/screens/AddRoundModal';
import ProfileScreen from './src/screens/ProfileScreen';
import EditRoundModal from './src/screens/EditRoundModal';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'player' | null>(null);

  // Mantiene la sesión activa
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Carga el rol del usuario autenticado
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
      if (!error && data) setRole(data.role as 'admin' | 'player');
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
        {/* Sin sesión: Login + Registro */}
        {!session ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registro' }} />
          </>
        ) : role === 'admin' ? (
          // Flujo admin
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
          // Flujo jugador
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
