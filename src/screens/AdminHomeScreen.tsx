// src/screens/AdminHomeScreen.tsx
import React from 'react';
import { View, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';
import { colors } from '../theme'; 

export default function AdminHomeScreen() {
  const nav = useNavigation<any>();
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Button //adm jugadores
        title="Gestionar jugadores"
        onPress={() => nav.navigate('Players')}
        color={colors.dark}
      />
      

      <Button //botón ed ranking
        title="Ranking"
        onPress={() => nav.navigate('Ranking')}
        color={colors.dark}
      />

      <Button //boton cierre de sesion
        title="Cerrar sesión"
        color="tomato"
        onPress={() => supabase.auth.signOut()}
      />
    </View>
  );
}