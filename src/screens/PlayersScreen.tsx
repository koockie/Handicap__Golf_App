// src/screens/PlayersScreen.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react'; 
import {
  View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Button,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; 
import { supabase } from '../supabase';
import { Role } from '../types';
import { colors } from '../theme';
import { computeCourseHandicap } from '../utils/handicap';

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
    <View style={{ flex: 1, padding: 12, backgroundColor: colors.bg }}>
      
      {/* --- BOTONES DE ACCIÓN --- */}
      <View style={{ marginBottom: 12, gap: 8 }}>
        {/* 1. Volver al Dashboard (Solo admin) - Nombre corregido: AdminHomeScreen */}
        {isAdmin && (
           <Button 
             title="⬅ Volver al Menú Admin" 
             onPress={() => navigation.navigate('AdminHomeScreen')} 
             color={colors.dark} 
           />
        )}
        
        {/* 2. Ver Ranking (RESTAURADO) */}
        <Button
          title="Ver Ranking Completo"
          onPress={() => navigation.navigate('Ranking')}
          color="#2c3e50" // Un color un poco distinto para diferenciar
        />
      </View>

      <TextInput
        placeholder="Buscar jugador..."
        style={styles.search}
        value={q}
        onChangeText={setQ}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.dark} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(x) => x.user_id}
          renderItem={({ item }) => {
            const hi = item.handicap_index;
            const ch = (hi !== null) ? computeCourseHandicap(hi, PAPUDO_CR, PAPUDO_SR, PAPUDO_PAR) : null;
            return (
              <TouchableOpacity
                onPress={() => navigation.navigate('PlayerDetail', { playerId: item.user_id, displayName: item.display_name })}
                style={styles.card}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.display_name}</Text>
                  <Text style={styles.subtext}>{item.role}</Text>
                </View>
                <View style={styles.handicapBox}>
                  <Text style={styles.chText}>Hándicap: {ch ?? '—'}</Text>
                </View>
                {isAdmin && (
                  <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.deleteBtn}>
                     <Text style={styles.deleteTxt}>{busyDelete === item.user_id ? '...' : 'X'}</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { borderWidth: 1, borderColor: colors.border, padding: 10, borderRadius: 10, marginBottom: 8, backgroundColor: '#fff' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: '#fff', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  subtext: { fontSize: 12, color: '#888', marginTop: 2 },
  handicapBox: { backgroundColor: colors.dark, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', minWidth: 60 },
  chText: { color: colors.light, fontWeight: '700', fontSize: 12 },
  deleteBtn: { marginLeft: 8, padding: 10, borderRadius: 10, backgroundColor: '#ff4d4d' },
  deleteTxt: { color: '#fff', fontWeight: '700' },
});