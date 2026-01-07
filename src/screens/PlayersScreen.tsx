// src/screens/PlayersScreen.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react'; 
import {
  View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ImageBackground, Dimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; 
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase';
import { Role } from '../types';
import { colors } from '../theme';
import { computeCourseHandicap } from '../utils/handicap';

const { width } = Dimensions.get('window');

type PlayerRow = {
  user_id: string; 
  display_name: string;
  role: Role;
  handicap_index: number | null;
};

const PAPUDO_CR = 65.6;
const PAPUDO_SR = 115;
const PAPUDO_PAR = 68;

export default function PlayersScreen({ navigation }: any) {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [q, setQ] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyDelete, setBusyDelete] = useState<string | null>(null);

  // 1. Verificar Admin
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('role').eq('user_id', user.id).maybeSingle();
      setIsAdmin(data?.role === 'admin');
    })();
  }, []);

  // 2. Cargar Lista
  const loadPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .order('display_name', { ascending: true });

      if (profilesError) throw profilesError;

      const playersOnly = (profiles ?? []).filter((p) => p.role === 'player');

      const { data: handicaps, error: hError } = await supabase
        .from('player_handicap')
        .select('player_id, handicap_index');

      if (hError) throw hError;

      const playersData: PlayerRow[] = playersOnly.map((p: any) => {
        const h = handicaps?.find((x) => x.player_id === p.id);
        return {
          user_id: p.id, 
          display_name: p.display_name || 'Sin nombre',
          role: p.role,
          handicap_index: h?.handicap_index ?? null,
        };
      });

      setPlayers(playersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []); 

  useFocusEffect(useCallback(() => { loadPlayers(); }, [loadPlayers]));

  // Lógica de borrado
  const confirmDelete = (player: PlayerRow) => {
    if (!isAdmin) return;
    Alert.alert('Eliminar', `¿Borrar a ${player.display_name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => doDelete(player) },
    ]);
  };

  const doDelete = async (player: PlayerRow) => {
    try {
      setBusyDelete(player.user_id);
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { profileId: player.user_id }, 
      });
      if (error) throw error;
      await loadPlayers();
    } catch (err: any) {
      Alert.alert('Error', err?.message);
    } finally {
      setBusyDelete(null);
    }
  };

  const filtered = useMemo(() => players.filter((p) => p.display_name?.toLowerCase().includes(q.toLowerCase())), [players, q]);

  return (
    <ImageBackground
        source={require('../../assets/fondo.jpg')} 
        style={styles.background}
        resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
        style={styles.gradient}
      >
        <View style={styles.container}>
          
          <Text style={styles.screenTitle}>Directorio de Jugadores</Text>

          {/* --- BOTONES DE ACCIÓN SUPERIORES --- */}
          <View style={styles.topActions}>
            {/* 1. Volver (Solo Admin) */}
            {isAdmin && (
               <TouchableOpacity 
                 style={[styles.actionBtn, styles.backBtn]}
                 onPress={() => navigation.navigate('AdminHomeScreen')}
               >
                 <Text style={styles.btnText}>⬅ Menú Admin</Text>
               </TouchableOpacity>
            )}
            
            {/* 2. Ranking */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.rankingBtn, !isAdmin && { flex: 1 }]}
              onPress={() => navigation.navigate('Ranking')}
            >
              <Text style={styles.btnText}>🏆 Ver Ranking</Text>
            </TouchableOpacity>
          </View>

          {/* --- BUSCADOR --- */}
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="🔍 Buscar por nombre..."
              placeholderTextColor="#666"
              style={styles.searchInput}
              value={q}
              onChangeText={setQ}
            />
          </View>

          {/* --- LISTA --- */}
          {loading ? (
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(x) => x.user_id}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => {
                const hi = item.handicap_index;
                const ch = (hi !== null) ? computeCourseHandicap(hi, PAPUDO_CR, PAPUDO_SR, PAPUDO_PAR) : null;
                
                return (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('PlayerDetail', { playerId: item.user_id, displayName: item.display_name })}
                    activeOpacity={0.8}
                    style={styles.card}
                  >
                    {/* Círculo decorativo (Avatar simple) */}
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{item.display_name.charAt(0).toUpperCase()}</Text>
                    </View>

                    {/* Info Central */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{item.display_name}</Text>
                      <Text style={styles.subtext}>
                        {item.role === 'admin' ? 'Administrador' : 'Jugador'}
                      </Text>
                    </View>

                    {/* Handicap Badge */}
                    <View style={styles.handicapBox}>
                      <Text style={styles.chLabel}>Hándicap</Text>
                      <Text style={styles.chValue}>{ch ?? '—'}</Text>
                    </View>

                    {/* Botón Borrar (Admin) */}
                    {isAdmin && (
                      <TouchableOpacity 
                        onPress={() => confirmDelete(item)} 
                        style={styles.deleteBtn}
                        disabled={busyDelete === item.user_id}
                      >
                         <Text style={styles.deleteTxt}>{busyDelete === item.user_id ? '...' : '✕'}</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%' },
  gradient: { flex: 1 },
  container: { flex: 1, padding: 16, paddingTop: 50 },

  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },

  // BOTONES SUPERIORES
  topActions: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 3,
  },
  backBtn: { backgroundColor: '#4a5568' }, // Gris azulado
  rankingBtn: { backgroundColor: colors.dark }, // Verde corporativo
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // BUSCADOR
  searchContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  searchInput: {
    padding: 12,
    fontSize: 16,
    color: '#333',
  },

  // TARJETA DE JUGADOR
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)', // Glassmorphism
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2,
  },
  avatarCircle: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
  
  name: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  subtext: { fontSize: 12, color: '#64748b', marginTop: 2 },

  // BADGE HANDICAP
  handicapBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 50,
  },
  chLabel: { fontSize: 9, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' },
  chValue: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

  // BORRAR
  deleteBtn: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2', // Rojo muy suave
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 5,
    borderWidth: 1, borderColor: '#ef4444'
  },
  deleteTxt: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
});