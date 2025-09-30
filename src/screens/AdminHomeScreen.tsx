import React from 'react';
import { View, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';

export default function AdminHomeScreen(){
  const nav = useNavigation<any>();
  return (
    <View style={{padding:16, gap:12}}>
      <Button title="Gestionar jugadores" onPress={()=>nav.navigate('Players')}/>
      {/* En una iteración siguiente: crear jugadores/admins desde la app */}
      <Button title="Cerrar sesión" color="tomato" onPress={()=>supabase.auth.signOut()}/>
    </View>
  );
}
