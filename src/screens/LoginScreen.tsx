import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, Image } from 'react-native'; 
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (/email.*not.*confirmed/i.test(error.message)) {
          return Alert.alert(
            'Confirma tu correo',
            'Tu email aún no está confirmado. Revisa tu bandeja de entrada.'
          );
        }
        return Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/handicap-pro-logo.png')} //imagen logo
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
        placeholderTextColor="#888" // Color de placeholder
      />
      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#888" // Color de placeholder
      />
 
      <Button 
        title={loading ? 'Entrando…' : 'Entrar'} 
        onPress={handleLogin} 
        disabled={loading} 
        color={colors.dark} // Aplicamos el color del tema
      />
      <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
        ¿No tienes cuenta? Regístrate
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20,
    backgroundColor: colors.bg, 
  },
  logo: { // Estilo foto logo
    width: 400, //ancho
    height: 400, // alto
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 200,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '700',
    marginBottom: 20, 
    textAlign: 'center',
    color: colors.text,
  },
  input: { 
    borderWidth: 1, 
    borderColor: colors.border,
    padding: 12, 
    borderRadius: 8, // Bordes redondeados
    marginBottom: 12, 
    backgroundColor: '#fff', // Fondo blanco para el input
    fontSize: 16,
    color: colors.text,
  },
  link: { 
    color: colors.dark, 
    marginTop: 15, 
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
});