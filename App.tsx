// App.tsx
import React, { useEffect, useState } from 'react';
import { Alert, View, Pressable, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { supabase } from './src/supabase';
import { colors } from './src/theme';
import { RootStackParamList } from './src/types';

// Pantallas
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AdminHomeScreen from './src/screens/AdminHomeScreen';
import PlayersScreen from './src/screens/PlayersScreen';
import PlayerDetailScreen from './src/screens/PlayerDetailScreen';
import AddRoundModal from './src/screens/AddRoundModal';
import EditRoundModal from './src/screens/EditRoundModal';
import ProfileScreen from './src/screens/ProfileScreen';
import RankingScreen from './src/screens/RankingScreen'; 

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
      if (!session) {
        setRole(null);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRole(null);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!error && data) setRole(data.role as 'admin' | 'player');
    })();
  }, [session]);

  const handleLogout = async () => {
    Alert.alert('Cerrar sesión', '¿Deseas salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          setSession(null);
          setRole(null);
        },
      },
    ]);
  };

  const screenOptionsWithLogout: NativeStackNavigationOptions = {
    headerStyle: { backgroundColor: colors.dark },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: '700' },
    contentStyle: { backgroundColor: colors.bg },
    headerRight: () => (
      <Pressable
        onPress={handleLogout}
        style={{ marginRight: 10, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#ff4d4d' }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Salir</Text>
      </Pressable>
    ),
  };

  return (
    <NavigationContainer>
      {!session ? (
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.dark },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registro' }} />
        </Stack.Navigator>
      ) : role === 'admin' ? (
        <Stack.Navigator screenOptions={screenOptionsWithLogout}>
          
          {/* CORRECCIÓN AQUÍ: El nombre es AdminHomeScreen */}
          <Stack.Screen name="AdminHomeScreen" component={AdminHomeScreen} options={{ title: 'Administrador' }} />
          
          <Stack.Screen name="Players" component={PlayersScreen} options={{ title: 'Jugadores' }} />
          <Stack.Screen name="PlayerDetail" component={PlayerDetailScreen} options={({ route }) => ({ title: route.params?.displayName ?? 'Detalle' })} />
          <Stack.Screen name="Ranking" component={RankingScreen} options={{ title: 'Ranking' }} />
          <Stack.Screen name="AddRound" component={AddRoundModal} options={{ title: 'Agregar tarjeta' }} />
          <Stack.Screen name="EditRound" component={EditRoundModal} options={{ title: 'Editar tarjeta' }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={screenOptionsWithLogout}>
          <Stack.Screen name="Players" component={PlayersScreen} options={{ title: 'Jugadores' }} />
          <Stack.Screen name="PlayerDetail" component={PlayerDetailScreen} options={({ route }) => ({ title: route.params?.displayName ?? 'Detalle' })} />
          <Stack.Screen name="Ranking" component={RankingScreen} options={{ title: 'Ranking' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mi perfil' }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}