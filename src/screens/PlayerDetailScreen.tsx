// src/screens/PlayerDetailScreen.tsx
import React, { useEffect, useState, useCallback } from 'react'; 
import { View, Text, FlatList, Alert, StyleSheet, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; 
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase';
import { Round } from '../types';
import { computeHandicapIndex, computeCourseHandicap } from '../utils/handicap';
import { colors } from '../theme';

// Configuración de cancha
const PAPUDO_CR = 65.6;
const PAPUDO_SR = 115;
const PAPUDO_PAR = 68; 

export default function PlayerDetailScreen({ route, navigation }: any) {
  const { playerId, displayName } = route.params;
  const [rounds, setRounds] = useState<Round[]>([]);
  const [hi, setHi] = useState<number | null>(null);
  const [chPapudo, setChPapudo] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Cargar Datos
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; 

      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('player_id', playerId)
        .order('played_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      const rs = (data ?? []) as Round[];
      setRounds(rs);
      
      const calculatedHi = computeHandicapIndex(rs);
      setHi(calculatedHi);

      if (calculatedHi !== null) {
        const papudoCH = computeCourseHandicap(calculatedHi, PAPUDO_CR, PAPUDO_SR, PAPUDO_PAR);
        setChPapudo(papudoCH);
      } else {
        setChPapudo(null); 
      }
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // 2. Verificar Admin
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: me } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user!.id)
        .maybeSingle();
      setIsAdmin(me?.role === 'admin');
    })();
  }, []); 

  const deleteRound = async (id: string) => {
    Alert.alert('Eliminar Tarjeta', '¿Estás seguro de borrar esta tarjeta permanentemente?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
            const { error } = await supabase.from('rounds').delete().eq('id', id);
            if (error) return Alert.alert('Error', error.message);
            await load(); 
        }}
    ]);
  };

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
          
          {/* --- ENCABEZADO --- */}
          <View style={styles.header}>
              <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.playerName}>{displayName}</Text>
              
              <View style={styles.statsContainer}>
                  <View style={styles.statBox}>
                      <Text style={styles.statLabel}>INDEX (HI)</Text>
                      <Text style={styles.statValue}>{hi !== null ? hi.toFixed(1) : '—'}</Text>
                  </View>
                  <View style={[styles.statBox, styles.statActive]}>
                      <Text style={[styles.statLabel, {color: '#fff'}]}>HCP JUEGO</Text>
                      <Text style={[styles.statValue, {color: '#fff'}]}>{chPapudo !== null ? chPapudo : '—'}</Text>
                  </View>
              </View>
          </View>

          {/* --- BOTÓN AGREGAR (SOLO ADMIN) --- */}
          {isAdmin && (
            <TouchableOpacity 
                style={styles.addBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AddRound', { playerId })}
            >
                <Text style={styles.addBtnText}>+ NUEVA TARJETA</Text>
            </TouchableOpacity>
          )}

          {/* --- LISTA DE TARJETAS --- */}
          {loading ? (
             <ActivityIndicator size="large" color="#fff" style={{marginTop: 20}} />
          ) : (
             <FlatList
                data={rounds}
                keyExtractor={(r) => r.id}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item, index }) => {
                  
                  // CÁLCULO DEL NÚMERO DE TARJETA (Histórico)
                  // Como la lista está ordenada DESC (la más nueva primero),
                  // la tarjeta #1 es la última de la lista.
                  const roundNumber = rounds.length - index;

                  const ch = (hi !== null && Number.isFinite(hi))
                    ? computeCourseHandicap(hi, item.course_rating, item.course_slope, item.course_par)
                    : null;

                  return (
                    <View style={styles.card}>
                      {/* Encabezado de la Tarjeta */}
                      <View style={styles.cardHeader}>
                          
                          {/* Izquierda: Badge N° y Fecha */}
                          <View style={styles.headerLeft}>
                            <View style={styles.roundBadge}>
                                <Text style={styles.roundBadgeText}>#{roundNumber}</Text>
                            </View>
                            <Text style={styles.date}>{item.played_at}</Text>
                          </View>

                          {/* Derecha: Nombre Cancha */}
                          <Text style={styles.courseName}>{item.course_name}</Text>
                      </View>

                      {/* Cuerpo de la Tarjeta */}
                      <View style={styles.cardBody}>
                          
                          <View style={styles.infoCol}>
                              <Text style={styles.infoLabel}>SCORE BRUTO</Text>
                              <Text style={styles.infoValue}>{item.adjusted_score}</Text>
                          </View>

                          <View style={styles.verticalDivider} />

                          <View style={styles.infoCol}>
                              <Text style={styles.infoLabel}>HCP JUEGO</Text>
                              <Text style={styles.infoValue}>{ch ?? '-'}</Text>
                          </View>

                      </View>
                      
                      {/* Info Técnica Sutil */}
                      <Text style={styles.techInfo}>
                          Par: {item.course_par} • CR: {item.course_rating} • SR: {item.course_slope}
                      </Text>

                      {/* Botones Admin */}
                      {isAdmin && (
                        <View style={styles.adminActions}>
                          <TouchableOpacity 
                            onPress={() => navigation.navigate('EditRound', { roundId: item.id })} 
                            style={[styles.actionBtn, styles.editBtn]}
                            activeOpacity={0.7}
                          >
                              <Text style={[styles.actionText, styles.editText]}>✏ Editar</Text>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            onPress={() => deleteRound(item.id)} 
                            style={[styles.actionBtn, styles.deleteBtn]}
                            activeOpacity={0.7}
                          >
                              <Text style={[styles.actionText, styles.deleteText]}>🗑 Eliminar</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                }}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No hay tarjetas registradas.</Text>
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
  container: { flex: 1, padding: 16 },

  // HEADER JUGADOR
  header: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  avatar: { 
      width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', 
      justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
  },
  avatarText: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  playerName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 15, textAlign: 'center' },
  
  statsContainer: { flexDirection: 'row', gap: 15 },
  statBox: { 
      backgroundColor: 'rgba(255,255,255,0.9)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10, alignItems: 'center', minWidth: 90
  },
  statActive: { backgroundColor: colors.dark }, 
  statLabel: { fontSize: 10, fontWeight: '700', color: '#666', marginBottom: 2 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#333' },

  // BOTÓN AGREGAR (ADMIN)
  addBtn: {
      backgroundColor: colors.dark, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 20,
      shadowColor: colors.dark, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 5
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', letterSpacing: 1, fontSize: 16 },

  // TARJETA DE RONDA
  card: {
      backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 16, marginBottom: 12,
      shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 3
  },
  
  // ESTILOS NUEVOS PARA HEADER TARJETA CON NÚMERO
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', // Alineación vertical centrada
    marginBottom: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee', 
    paddingBottom: 8 
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roundBadge: {
    backgroundColor: colors.dark,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roundBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  date: { fontSize: 13, color: '#666', fontWeight: '600' },
  courseName: { fontSize: 14, color: colors.dark, fontWeight: 'bold' },

  cardBody: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', marginBottom: 12 },
  infoCol: { alignItems: 'center' },
  infoLabel: { fontSize: 11, color: '#888', fontWeight: '700', letterSpacing: 1 },
  infoValue: { fontSize: 22, color: '#333', fontWeight: '900' },
  
  verticalDivider: { width: 1, height: '80%', backgroundColor: '#eee' },

  techInfo: { fontSize: 10, color: '#aaa', textAlign: 'center', marginBottom: 5 },

  // BOTONES DE ACCIÓN (ADMIN)
  adminActions: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 15, 
    paddingTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#f0f0f0' 
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editBtn: { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' },
  deleteBtn: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  actionText: { fontWeight: '700', fontSize: 13 },
  editText: { color: '#0284c7' }, 
  deleteText: { color: '#dc2626' }, 

  emptyText: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 30 },
});