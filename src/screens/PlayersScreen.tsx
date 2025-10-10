import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert, // 👈 añadido
} from 'react-native';
import { supabase } from '../supabase';
import { Role } from '../types';
import { colors } from '../theme';
import AdminPanel from '../components/AdminPanel';

type PlayerRow = {
  user_id: string;
  display_name: string;
  role: Role;
  handicap_index: number | null;
};

export default function PlayersScreen({ navigation }: any) {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [q, setQ] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyDelete, setBusyDelete] = useState<string | null>(null); // 👈 añadido

  // 🔹 Verificar si el usuario actual es administrador
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

  // 🔹 Cargar todos los jugadores + hándicap
  const loadPlayers = async () => {
    try {
      setLoading(true);

      // 1️⃣ Obtener todos los perfiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, role')
        .order('display_name', { ascending: true });

      if (profilesError) throw profilesError;

      // 2️⃣ Filtrar solo jugadores
      const playersOnly = (profiles ?? []).filter((p) => p.role === 'player');

      // 3️⃣ Obtener hándicaps de todos los jugadores
      const { data: handicaps, error: hError } = await supabase
        .from('player_handicap')
        .select('player_id, handicap_index');

      if (hError) throw hError;

      // 4️⃣ Vincular cada jugador con su hándicap (si tiene)
      const playersData: PlayerRow[] = playersOnly.map((p: any) => {
        const h = handicaps?.find((x) => x.player_id === p.user_id);
        return {
          user_id: p.user_id,
          display_name: p.display_name || 'Sin nombre',
          role: p.role,
          handicap_index: h?.handicap_index ?? null,
        };
      });

      // 5️⃣ Actualizar el estado
      setPlayers(playersData);
    } catch (err) {
      console.error('Error cargando jugadores:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Cargar jugadores al montar y suscribirse en tiempo real
  useEffect(() => {
    loadPlayers();

    // 🟢 Suscripción en tiempo real a cambios en la tabla profiles
    const channel = supabase
      .channel('realtime-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => loadPlayers()
      )
      .subscribe();

    // 🧹 Limpiar al desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 🔍 Filtrado por nombre (insensible a mayúsculas)
  const filtered = useMemo(
    () =>
      players.filter((p) =>
        p.display_name?.toLowerCase().includes(q.toLowerCase())
      ),
    [players, q]
  );

  // ✅ Confirmación y eliminación (solo admins)
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
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: player.user_id },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'No se pudo eliminar.');
      await loadPlayers(); // recargar lista
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo eliminar.');
    } finally {
      setBusyDelete(null);
    }
  };

  return (
    <View style={{ flex: 1, padding: 12, backgroundColor: colors.bg }}>
      {/* Panel de administración visible solo para admins */}
      {isAdmin && <AdminPanel onUserCreated={loadPlayers} />}

      <TextInput
        placeholder="Buscar jugador..."
        style={styles.search}
        value={q}
        onChangeText={setQ}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.dark}
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(x) => x.user_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('PlayerDetail', {
                  playerId: item.user_id,
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

              <View style={styles.hiPill}>
                <Text style={styles.hiText}>{item.handicap_index ?? '—'}</Text>
              </View>

              {/* 👇 Botón eliminar SOLO para admins */}
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
          )}
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
  hiPill: {
    backgroundColor: colors.dark,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  hiText: { color: '#fff', fontWeight: '700' },
  deleteBtn: {
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#ff4d4d',
  },
  deleteTxt: { color: '#fff', fontWeight: '700' },
});
