// src/screens/RankingScreen.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react'; 
import {
  View, FlatList, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ImageBackground
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; 
import { LinearGradient } from 'expo-linear-gradient';
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

// Constantes del club (Asegúrate de que sean las correctas de tu cancha)
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
      
      // 1. Cargar perfiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('role', 'player')
        .order('display_name', { ascending: true });

      if (profilesError) throw profilesError;

      // 2. Cargar Hándicaps
      const { data: handicaps, error: hError } = await supabase
        .from('player_handicap')
        .select('player_id, handicap_index')
        .not('handicap_index', 'is', null);

      if (hError) throw hError;

      // 3. Unir datos
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

  useFocusEffect(useCallback(() => { loadRanking(); }, [loadRanking]));

  // Suscripción a cambios en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel('realtime-ranking')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, () => loadRanking())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadRanking())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadRanking]); 

  // Lógica de Ordenamiento
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      return sort === 'asc' 
        ? a.handicap_index - b.handicap_index 
        : b.handicap_index - a.handicap_index;
    });
  }, [players, sort]);

  const toggleSort = () => setSort((c) => (c === 'asc' ? 'desc' : 'asc'));

  // Colores de Medallas
  const getRankColor = (index: number) => {
    if (index === 0) return '#FFD700'; // Oro
    if (index === 1) return '#C0C0C0'; // Plata
    if (index === 2) return '#CD7F32'; // Bronce
    return 'rgba(255,255,255,0.2)'; // Resto
  };

  const getRankTextColor = (index: number) => {
    if (index <= 2) return '#fff'; 
    return '#333'; // Color oscuro para las medallas normales (si el fondo es claro) o blanco si prefieres
  };

  return (
    <ImageBackground
        source={require('../../assets/fondo.jpg')} 
        style={styles.background}
        resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
        style={styles.gradient}
      >
        <View style={styles.container}>
          
          <Text style={styles.headerTitle}>TABLA DE POSICIONES</Text>
          
          {/* BOTÓN ORDENAR */}
          <TouchableOpacity onPress={toggleSort} style={styles.sortButton}>
            <Text style={styles.sortButtonText}>
              {sort === 'asc' ? '⬇ Mejor Hándicap' : '⬆ Peor Hándicap'}
            </Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={sortedPlayers}
              keyExtractor={(item) => item.player_id}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item, index }) => {
                const hi = item.handicap_index;
                // Calculamos el Hándicap de Juego (HC)
                const hc = computeCourseHandicap(hi, PAPUDO_CR, PAPUDO_SR, PAPUDO_PAR);
                const rankColor = getRankColor(index);
                const isTop3 = index <= 2;
                
                return (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.card}
                    onPress={() =>
                      navigation.navigate('PlayerDetail', {
                        playerId: item.player_id,
                        displayName: item.display_name,
                      })
                    }
                  >
                    {/* MEDALLA / POSICIÓN */}
                    <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
                      <Text style={[styles.rankText, { color: isTop3 ? '#fff' : '#555' }]}>
                        {index + 1}
                      </Text>
                    </View>

                    {/* NOMBRE JUGADOR (Ahora centrado verticalmente) */}
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                      <Text style={styles.playerName}>{item.display_name}</Text>
                    </View>

                    {/* SOLO HÁNDICAP DE JUEGO (HC) */}
                    <View style={styles.scoreBox}>
                      <Text style={styles.scoreLabel}>HC</Text>
                      <Text style={styles.scoreValue}>{hc}</Text>
                    </View>
                    
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  Aún no hay jugadores con hándicap oficial.
                </Text>
              }
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

  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
    letterSpacing: 1,
  },

  sortButton: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  sortButtonText: { color: '#ddd', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },

  // TARJETA DE RANKING
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 18, // Un poco más de aire vertical
    paddingHorizontal: 15,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  
  // MEDALLA
  rankBadge: {
    width: 42, height: 42,
    borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  playerName: {
    fontSize: 17, // Letra un poco más grande
    fontWeight: '700',
    color: '#1e293b',
  },

  // SCORE BOX (HC)
  scoreBox: {
    alignItems: 'center',
    backgroundColor: colors.dark,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    minWidth: 55,
  },
  scoreLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '800' },
  scoreValue: { fontSize: 20, color: '#fff', fontWeight: 'bold' }, // Número grande

  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
});