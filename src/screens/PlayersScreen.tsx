// src/screens/PlayersScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Button,
} from 'react-native';
import { supabase } from '../supabase';
import { Role } from '../types';
import { colors } from '../theme';
import AdminPanel from '../components/AdminPanel';
// --- 1. Importar la función de cálculo ---
import { computeCourseHandicap } from '../utils/handicap';

type PlayerRow = {
  user_id: string; 
  display_name: string;
  role: Role;
  handicap_index: number | null;
};

// --- 2. Definir constantes del club ---
const PAPUDO_CR = 65.6;
const PAPUDO_SR = 115;
const PAPUDO_PAR = 66;

export default function PlayersScreen({ navigation }: any) {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [q, setQ] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyDelete, setBusyDelete] = useState<string | null>(null);

  // Verificar si el usuario actual es administrador (vía profiles.user_id = auth.user.id)
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      setIsAdmin(data?.role === 'admin');
    })();
  }, []);

  // Cargar todos los jugadores + hándicap
  const loadPlayers = async () => {
    try {
      setLoading(true);

      // 1) Obtener perfiles (OJO: ahora pedimos id)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .order('display_name', { ascending: true });

      if (profilesError) throw profilesError;

      // 2) Filtrar solo jugadores
      const playersOnly = (profiles ?? []).filter((p) => p.role === 'player');

      // 3) Obtener hándicaps
      const { data: handicaps, error: hError } = await supabase
        .from('player_handicap')
        .select('player_id, handicap_index');

      if (hError) throw hError;

      // 4) Vincular jugador con su HI (join por profiles.id)
      const playersData: PlayerRow[] = playersOnly.map((p: any) => {
        const h = handicaps?.find((x) => x.player_id === p.id);
        return {
          user_id: p.id, // <- mapeamos profiles.id a la propiedad que usa la UI
          display_name: p.display_name || 'Sin nombre',
          role: p.role,
          handicap_index: h?.handicap_index ?? null,
        };
      });

      setPlayers(playersData);
    } catch (err) {
      console.error('Error cargando jugadores:', err);
    } finally {
      setLoading(false);
    }
  };

  // Suscripción realtime
  useEffect(() => {
    loadPlayers();

    const channel = supabase
      .channel('realtime-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => loadPlayers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtro por nombre
  const filtered = useMemo(
    () =>
      players.filter((p) =>
        p.display_name?.toLowerCase().includes(q.toLowerCase())
      ),
    [players, q]
  );

  // Confirmación y eliminación (solo admins)
  const confirmDelete = (player: PlayerRow) => {
    if (!isAdmin) return;
    Alert.alert(
      'Eliminar deportista',
      `¿Eliminar a "${player.display_name}"? Se borrará su perfil y sus tarjetas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => doDelete(player),
        },
      ]
    );
  };

  const doDelete = async (player: PlayerRow) => {
    try {
      setBusyDelete(player.user_id);

      // IMPORTANTE:
      // Ahora user_id = profiles.id (perfil), no el id de Auth.
      // Llama a tu edge function pasando profileId.
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { profileId: player.user_id }, // <- enviar el id del perfil
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'No se pudo eliminar.');

      await loadPlayers();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo eliminar.');
    } finally {
      setBusyDelete(null);
    }
  };

  return (
    <View style={{ flex: 1, padding: 12, backgroundColor: colors.bg }}>
      {/* Panel admin */}
      {isAdmin && <AdminPanel onUserCreated={loadPlayers} />}

      {/* Botón de Ranking visible para todos */}
      <View style={{ marginBottom: 8, marginTop: isAdmin ? 0 : 8 }}>
        <Button
          title="Ver Ranking"
          onPress={() => navigation.navigate('Ranking')}
          color={colors.dark}
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
            // --- 3. Calcular HI y CH ---
            const hi = item.handicap_index;
            const ch = (hi !== null)
              ? computeCourseHandicap(hi, PAPUDO_CR, PAPUDO_SR, PAPUDO_PAR)
              : null;
              
            return (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('PlayerDetail', {
                    playerId: item.user_id, // <- pasa profiles.id
                    displayName: item.display_name,
                  })
                }
                style={styles.card}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.display_name}</Text>
                  <Text style={styles.subtext}>
                    {item.role === 'admin' ? 'Administrador' : 'Jugador'}
                  </Text>
                </View>

                {/* --- 4. Mostrar HI y CH --- */}
                <View style={styles.handicapBox}>
                  <Text style={styles.hiText}>
                    HI: {hi !== null ? hi.toFixed(1) : '—'}
                  </Text>
                  <Text style={styles.chText}>
                    CH: {ch !== null ? ch : '—'}
                  </Text>
                </View>

                {isAdmin && (
                  <TouchableOpacity
                    onPress={() => confirmDelete(item)}
                    style={[
                      styles.deleteBtn,
                      busyDelete === item.user_id && { opacity: 0.6 },
                    ]}
                    disabled={busyDelete === item.user_id}
                  >
                    <Text style={styles.deleteTxt}>
                      {busyDelete === item.user_id ? '...' : 'Eliminar'}
                    </Text>
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
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#fff',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  subtext: { fontSize: 12, color: '#888', marginTop: 2 },
  
  // --- 5. Estilos para HI y CH ---
  handicapBox: { // Renombrado de hiPill
    backgroundColor: colors.dark,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10, // Menos redondo
    alignItems: 'center',
    minWidth: 60,
  },
  hiText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 14, // HI
  },
  chText: { // Nuevo estilo para CH
    color: colors.light, // Un color más suave
    fontWeight: '700',
    fontSize: 12,
    marginTop: 2,
  },
  // --- Fin estilos ---
  
  deleteBtn: {
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#ff4d4d',
  },
  deleteTxt: { color: '#fff', fontWeight: '700' },
});