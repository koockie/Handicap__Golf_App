// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { supabase } from '../supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors } from '../theme';

type LoginNav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: { navigation: LoginNav }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Campos requeridos', 'Ingresa correo y contraseña.');
    }
    try {
      setLoading(true);
      
      // 1. Login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (/email.*not.*confirmed/i.test(error.message)) {
          return Alert.alert('Confirma tu correo', 'Revisa tu bandeja de entrada.');
        }
        return Alert.alert('Error', error.message);
      }

      // 2. Verificar Rol y Redirigir
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (profile?.role === 'admin') {
          // Si es Admin -> Va al AdminHomeScreen (donde crea jugadores)
          navigation.replace('AdminHomeScreen' as any);
        } else {
          // Si es Player -> Va a la lista de jugadores (o Tabs)
          navigation.replace('Players' as any); 
        }
      }

    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Image
          source={require('../../assets/handicap-pro-logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Iniciar sesión</Text>
        <TextInput
          placeholder="Correo"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#888"
        />
        <TextInput
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#888"
        />
        <View style={{ height: 12 }} />
        <Button
          title={loading ? 'Entrando…' : 'Entrar'}
          onPress={handleLogin}
          disabled={loading}
          color={colors.dark}
        />
        <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
          ¿No tienes cuenta? Regístrate
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logo: { width: 250, height: 250, resizeMode: 'contain', alignSelf: 'center', marginBottom: 10, borderRadius: 125 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20, textAlign: 'center', color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: '#fff', fontSize: 16, color: colors.text },
  link: { color: colors.dark, marginTop: 15, textAlign: 'center', fontSize: 16, fontWeight: '500' },
});