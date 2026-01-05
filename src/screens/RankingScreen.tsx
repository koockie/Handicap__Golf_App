// src/screens/RankingScreen.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react'; 
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  Button,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; 
import { supabase } from '../supabase';
import { colors } from '../theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { computeCourseHandicap } from '../utils/handicap';

type RankingRow = {
  player_id: string; 
  display_name: string;
  handicap_index: number;
};

type RankingNav = NativeStackNavigationProp<RootStackParamList, 'Ranking'>;

// Constantes del club
const PAPUDO_CR = 65.6;
const PAPUDO_SR = 115;
const PAPUDO_PAR = 68;

export default function RankingScreen({ navigation }: { navigation: RankingNav }) {
  const [players, setPlayers] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'asc' | 'desc'>('asc');


  const loadRanking = useCallback(async () => {
  
    try {
      setLoading(true);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('role', 'player')
        .order('display_name', { ascending: true });

      if (profilesError) throw profilesError;

      const { data: handicaps, error: hError } = await supabase
        .from('player_handicap')
        .select('player_id, handicap_index')
        .not('handicap_index', 'is', null);

      if (hError) throw hError;

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
  }, []); 


  useFocusEffect(
    useCallback(() => {

      loadRanking(); 
    }, [loadRanking]) 
  );


  useEffect(() => {
    const channel = supabase
      .channel('realtime-ranking')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rounds' },
        () => loadRanking()
      )
      .on( 
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => loadRanking()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadRanking]); 

  // Lógica de ordenamiento 
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      if (sort === 'asc') {
        return a.handicap_index - b.handicap_index;
      } else {
        return b.handicap_index - a.handicap_index;
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
            // Calcular HI y CH
            const hi = item.handicap_index;
            const ch = computeCourseHandicap(hi, PAPUDO_CR, PAPUDO_SR, PAPUDO_PAR);
            
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate('PlayerDetail', {
                    playerId: item.player_id,
                    displayName: item.display_name,
                  })
                }
              >
                <View style={styles.rankPill}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.display_name}</Text>
                </View>

                {/* Mostrar HI y CH */}
                <View style={styles.handicapBox}>
                  <Text style={styles.chText}>Hándicap: {ch}</Text>
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

// --- 6. Estilos 
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
  handicapBox: { 
    backgroundColor: colors.dark,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10, 
    minWidth: 50, 
    alignItems: 'center',
  },
  hiText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  chText: {
    color: colors.light,
    fontWeight: '700',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 20,
  },
});