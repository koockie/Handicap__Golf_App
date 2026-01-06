// src/screens/AdminHomeScreen.tsx
import React, { useState } from 'react';
import { 
  View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, 
  KeyboardAvoidingView, Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';
import { colors } from '../theme';

export default function AdminHomeScreen() {
  const nav = useNavigation<any>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const createPlayer = async () => {
    // 1. El email es obligatorio para que funcione la vinculación futura
    if (!name.trim() || !email.trim()) {
      return Alert.alert('Faltan datos', 'Ingresa Nombre y Email para poder vincularlo después.');
    }

    try {
      setLoading(true);
      
      // 2. INSERTAR PERFIL "HUÉRFANO" (user_id: null)
      // El trigger en la BD se encargará de vincularlo cuando el usuario se registre.
      const { error } = await supabase
        .from('profiles')
        .insert({
          display_name: name.trim(),
          email: email.trim().toLowerCase(), // Normalizar email
          role: 'player',
          user_id: null 
        });

      if (error) throw error;

      Alert.alert(
        'Jugador Creado', 
        `Perfil listo.\nEl usuario debe registrarse con: ${email.trim().toLowerCase()}`
      );
      setName('');
      setEmail('');
      
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* FORMULARIO DE CREACIÓN */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Alta de Nuevo Jugador</Text>
          <Text style={styles.cardSubtitle}>
            Crea el perfil para cargarle tarjetas. El jugador recuperará este historial al registrarse.
          </Text>

          <Text style={styles.label}>Nombre y Apellido</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Juan Pérez"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Correo Electrónico (Obligatorio)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: juan.perez@gmail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button 
            title={loading ? "Guardando..." : "Crear Jugador"} 
            onPress={createPlayer} 
            color={colors.dark}
            disabled={loading}
          />
        </View>

        {/* MENÚ DE NAVEGACIÓN */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Opciones</Text>
          <Button 
            title="Ver lista de jugadores"
            onPress={() => nav.navigate('Players')}
            color={colors.dark}
          />
          <View style={{height: 10}} />
          <Button 
            title="Ver Ranking Actual"
            onPress={() => nav.navigate('Ranking')}
            color={colors.dark}
          />
          <View style={styles.separator} />
          <Button 
            title="Cerrar sesión"
            color="tomato"
            onPress={() => supabase.auth.signOut()}
          />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#eee' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 6, textAlign: 'center' },
  cardSubtitle: { fontSize: 12, color: '#666', marginBottom: 16, textAlign: 'center' },
  label: { fontWeight: '600', marginBottom: 6, color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#f9f9f9' },
  menuContainer: { gap: 8 },
  menuTitle: { fontSize: 16, fontWeight: 'bold', color: '#555', marginBottom: 8 },
  separator: { height: 12 },
});