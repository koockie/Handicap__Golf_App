// src/screens/RegisterScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ImageBackground, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Image } from 'react-native';
import { supabase } from '../supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

type RegisterNav = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: { navigation: RegisterNav }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleRegister = async () => {
    if (!email || !password) {
      return Alert.alert('Campos requeridos', 'Ingresa correo y contraseña.');
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: 'exp://192.168.1.66:8081' }
    });

    if (error) {
      if (/only request this after/i.test(error.message)) {
        setCooldown(60);
        return Alert.alert('Demasiadas solicitudes', 'Espera unos segundos.');
      }
      return Alert.alert('Error', error.message);
    }

    Alert.alert('¡Cuenta creada!', 'Ya puedes iniciar sesión con tus credenciales.');
    navigation.navigate('Login');
  };

  return (
    <ImageBackground
      source={require('../../assets/fondo.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            
            {/* LOGO PEQUEÑO O TÍTULO */}
            <View style={styles.headerContainer}>
               <Image source={require('../../assets/handicap-pro-logo.png')} style={styles.smallLogo} />
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>Crear Cuenta</Text>
              <Text style={styles.subtitle}>Únete y visualiza tu Handicap actualizado</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Correo Electrónico</Text>
                <TextInput
                  placeholder="ejemplo@golf.cl"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña Nueva</Text>
                <TextInput
                  placeholder="Mínimo 5 caracteres"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, cooldown > 0 && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={cooldown > 0}
              >
                <Text style={styles.buttonText}>
                  {cooldown > 0 ? `ESPERAR ${cooldown}s` : 'REGISTRARME'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footerLink}>
              <Text style={styles.footerText}>
                ¿Ya tienes cuenta? <Text style={styles.footerBold}>Inicia Sesión</Text>
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  gradient: { flex: 1 },
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },

  headerContainer: { marginBottom: 20, alignItems: 'center' },
  smallLogo: { width: 150, height: 150, borderRadius: 75, borderWidth: 2, borderColor: '#fff' },

  card: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.dark,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonDisabled: { backgroundColor: '#999' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  
  footerLink: { marginTop: 30, padding: 10 },
  footerText: { color: '#fff', fontSize: 15 },
  footerBold: { fontWeight: 'bold', textDecorationLine: 'underline' },
});