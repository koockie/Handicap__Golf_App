// src/screens/RankingScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  Button,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '../supabase';
import { colors } from '../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
// --- 1. Importar la función de cálculo ---
import { computeCourseHandicap } from '../utils/handicap';

type RankingRow = {
  player_id: string; 
  display_name: string;
  handicap_index: number;
};

type RankingNav = NativeStackNavigationProp<RootStackParamList, 'Ranking'>;

// --- 2. Definir constantes del club ---
const PAPUDO_CR = 65.6;
const PAPUDO_SR = 115;
const PAPUDO_PAR = 66;

export default function RankingScreen({ navigation }: { navigation: RankingNav }) {
  const [players, setPlayers] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'asc' | 'desc'>('asc');

  const loadRanking = async () => {
    try {
      setLoading(true);

      //obtiene perfiles de jugadores
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('role', 'player')
        .order('display_name', { ascending: true });

      if (profilesError) throw profilesError;

      //Obtenemos solo los hándicaps no nulos
      const { data: handicaps, error: hError } = await supabase
        .from('player_handicap')
        .select('player_id, handicap_index')
        .not('handicap_index', 'is', null);//solo jugadores con HI

      if (hError) throw hError;

      // uno los datos 
      const rankedPlayers: RankingRow[] = [];
      for (const h of handicaps ?? []) {
        const p = profiles?.find((x) => x.id === h.player_id);
        if (p) {
          rankedPlayers.push({
            player_id: p.id,
            display_name: p.display_name || 'Sin nombre',
            handicap_index: h.handicap_index as number,
          });
        }
      }
      setPlayers(rankedPlayers);
    } catch (err: any) {
      console.error('Error cargando ranking:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanking();

    // Nos suscribimos a cambios en las rondas
    const channel = supabase
      .channel('realtime-ranking')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rounds' },
        () => loadRanking()
      )
      .on( // También si se actualiza un perfil (ej. cambio de nombre)
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => loadRanking()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      if (sort === 'asc') {
        return a.handicap_index - b.handicap_index; // Menor a Mayor
      } else {
        return b.handicap_index - a.handicap_index; // Mayor a Menor
      }
    });
  }, [players, sort]);

  const toggleSort = () => {
    setSort((current) => (current === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <View style={styles.container}>
      <View style={styles.sortButtonContainer}>
        <Button
          title={`Ordenar: ${sort === 'asc' ? 'Mejor Hándicap (ASC)' : 'Peor Hándicap (DESC)'}`}
          onPress={toggleSort}
          color={colors.dark}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.dark} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={sortedPlayers}
          keyExtractor={(item) => item.player_id}
          renderItem={({ item, index }) => {
            // --- 3. Calcular HI y CH ---
            const hi = item.handicap_index; // La query ya filtró nulos
            const ch = computeCourseHandicap(hi, PAPUDO_CR, PAPUDO_SR, PAPUDO_PAR);

            return (
              <TouchableOpacity
                style={styles.card}
                //detalle del jugador (es de solo lectura para players)
                onPress={() =>
                  navigation.navigate('PlayerDetail', {
                    playerId: item.player_id,
                    displayName: item.display_name,
                  })
                }
              >
                {/* Posición en el ranking */}
                <View style={styles.rankPill}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>

                {/* Nombre */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.display_name}</Text>
                </View>

                {/* --- 4. Mostrar HI y CH --- */}
                <View style={styles.handicapBox}>
                  <Text style={styles.hiText}>{hi.toFixed(1)}</Text>
                  <Text style={styles.chText}>CH: {ch}</Text>
                </View>
                
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No hay jugadores con hándicap calculado (se requieren 3 tarjetas).
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.bg,
  },
  sortButtonContainer: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, 
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  rankPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: colors.dark,
    fontWeight: '700',
    fontSize: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  // --- 5. Estilos para HI y CH ---
  handicapBox: { // Renombrado de hiPill
    backgroundColor: colors.dark,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10, // Menos redondo
    minWidth: 60, 
    alignItems: 'center',
  },
  hiText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16, // HI grande
  },
  chText: { // Nuevo estilo para CH
    color: colors.light,
    fontWeight: '700',
    fontSize: 12,
    marginTop: 2,
  },
  // --- Fin estilos ---
  
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 20,
  },
});