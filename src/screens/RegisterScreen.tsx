import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { supabase } from '../supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

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
      // Ajusta a tu URL de Metro: mira la consola "exp://192.168.x.x:8081"
      options: { emailRedirectTo: 'exp://192.168.1.66:8081' }
    });

    if (error) {
      if (/only request this after/i.test(error.message)) {
        setCooldown(60);
        return Alert.alert(
          'Demasiadas solicitudes',
          'Espera unos segundos antes de intentar nuevamente.'
        );
      }
      return Alert.alert('Error al registrarse', error.message);
    }

    Alert.alert('Cuenta creada', 'Tu cuenta se ha creado correctamente. Ya puedes iniciar sesión.');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear nueva cuenta</Text>
      <TextInput
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button
        title={cooldown > 0 ? `Esperar ${cooldown}s` : 'Registrarme'}
        onPress={handleRegister}
        disabled={cooldown > 0}
      />
      <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
        ¿Ya tienes cuenta? Inicia sesión
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 10 },
  link: { color: 'blue', marginTop: 10, textAlign: 'center' },
});
