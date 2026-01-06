// src/components/AdminPanel.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../supabase';
import { colors } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AdminPanelProps = {
  onUserCreated?: () => void;
};

export default function AdminPanel({ onUserCreated }: AdminPanelProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'admin' | 'player'>('player');
  const [loading, setLoading] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(!open);
  };

  const invite = async () => {
    //exigir nombre
    if (!displayName.trim()) {
      return Alert.alert('Campo requerido', 'Debes ingresar el nombre del jugador.');
    }

    try {
      setLoading(true);

      // La edge function acepta email vacío ("") para crear perfil standalone.
      const payload = {
        email: email.trim(),                // "" crea perfil sin Auth
        displayName: displayName.trim(),
        role,
      };

      const { data, error } = await supabase.functions.invoke('invite-user', { body: payload });

      if (error) {
        console.error('Error en función:', error);
        return Alert.alert('Error', error.message || 'Fallo al invocar la función.');
      }

      // La nueva función siempre responde 200 con { ok: true/false, ... }
      if (!data?.ok) {
        const msg =
          data?.error ||
          data?.message ||
          'No se pudo crear el jugador. Revisa que tengas sesión y permiso de administrador.';
        return Alert.alert('Error', msg);
      }

      // Éxito
      Alert.alert('Listo', data?.message || 'Jugador creado correctamente.');

      // Limpiar
      setEmail('');
      setDisplayName('');
      setRole('player');

      // Notificar al padre 
      onUserCreated?.();
    } catch (err: any) {
      Alert.alert('Error inesperado', err?.message || 'No se pudo crear el jugador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.header} onPress={toggle}>
        <Text style={styles.headerText}>Administrar jugadores</Text>
        <Text style={styles.headerText}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.body}>
          <TextInput
            style={styles.input}
            placeholder="Nombre del jugador (obligatorio)"
            value={displayName}
            onChangeText={setDisplayName}
          />
          <TextInput
            style={styles.input}
            placeholder="Correo (opcional)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setRole('player')}
              style={[styles.roleBtn, role === 'player' && styles.roleBtnActive]}
            >
              <Text style={styles.roleTxt}>Player</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRole('admin')}
              style={[styles.roleBtn, role === 'admin' && styles.roleBtnActive]}
            >
              <Text style={styles.roleTxt}>Admin</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.inviteBtn, loading && { opacity: 0.6 }]}
            onPress={invite}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700' }}>Crear jugador</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  header: {
    padding: 12,
    backgroundColor: colors.dark,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: { color: '#fff', fontWeight: '700' },
  body: { padding: 12, gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
  },
  roleBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  roleBtnActive: { backgroundColor: colors.light },
  roleTxt: { color: colors.text },
  inviteBtn: {
    marginTop: 8,
    backgroundColor: colors.dark,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
