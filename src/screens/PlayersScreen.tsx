import React, { useEffect, useMemo, useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../supabase';
import { Role } from '../types';
import { colors } from '../theme';
import AdminPanel from '../components/AdminPanel'; // <- asegura que creaste este componente

type PlayerRow = {
  user_id: string;
  display_name: string;
  role: Role;
  handicap_index: number | null;
};

export default function PlayersScreen({ navigation }: any){
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [q, setQ] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // 1) Cargar jugadores con handicap (vista SQL players_with_handicap)
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('players_with_handicap')
        .select('*');
      if (!error && data) {
        setPlayers((data as any).filter((x: PlayerRow) => x.role === 'player'));
      } else {
        console.log('players_with_handicap error', error);
      }
    })();
  }, []);

  // 2) Saber si el usuario logueado es admin
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

  // 3) Filtro por texto
  const filtered = useMemo(
    () => players.filter(p => p.display_name.toLowerCase().includes(q.toLowerCase())),
    [players, q]
  );

  return (
    <View style={{ flex: 1, padding: 12, backgroundColor: colors.bg }}>
      {/* Panel de administración solo para admins */}
      {isAdmin && <AdminPanel />}

      <TextInput
        placeholder="Buscar jugador..."
        style={styles.search}
        value={q}
        onChangeText={setQ}
      />

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
              <Text selectable style={styles.id}>{item.user_id}</Text>
            </View>
            <View style={styles.hiPill}>
              <Text style={styles.hiText}>
                {item.handicap_index ?? '—'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
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
  id: { fontSize: 12, color: '#888' },
  hiPill: { backgroundColor: colors.dark, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  hiText: { color: '#fff', fontWeight: '700' },
});
