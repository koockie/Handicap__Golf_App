// src/screens/PlayerDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, Alert, StyleSheet } from 'react-native';
import { supabase } from '../supabase';
import { Round } from '../types';
import { computeHandicapIndex, computeCourseHandicap } from '../utils/handicap';
import { colors } from '../theme';

// --- 1. Definir constantes del club ---
const PAPUDO_CR = 65.6;
const PAPUDO_SR = 115;
const PAPUDO_PAR = 66;

export default function PlayerDetailScreen({ route, navigation }: any) {
  const { playerId, displayName } = route.params;
  const [rounds, setRounds] = useState<Round[]>([]);
  const [hi, setHi] = useState<number | null>(null);
  // --- 2. Añadir estado para el CH de Papudo ---
  const [chPapudo, setChPapudo] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; 

    const { data: me } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user!.id) 
      .maybeSingle();
    setIsAdmin(me?.role === 'admin');

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

    // --- 3. Calcular y guardar el CH de Papudo ---
    if (calculatedHi !== null) {
      const papudoCH = computeCourseHandicap(calculatedHi, PAPUDO_CR, PAPUDO_SR, PAPUDO_PAR);
      setChPapudo(papudoCH);
    } else {
      setChPapudo(null); // Resetear si no hay HI
    }
  };

  useEffect(() => { load(); }, [playerId]);

  const deleteRound = async (id: string) => {
    const { error } = await supabase.from('rounds').delete().eq('id', id);
    if (error) return Alert.alert('Error', error.message);
    await load(); // Recargar todo (incluido HI y CH)
  };

  return (
    <View style={{ flex: 1, padding: 12, gap: 8 }}>
      <Text style={styles.title}>
        {displayName}
      </Text>
      <Text style={styles.hiTitle}>
        Hándicap Index (HI): {hi !== null ? hi.toFixed(1) : '—'}
      </Text>
      {/* --- 4. Mostrar el CH de Papudo --- */}
      <Text style={styles.chTitle}>
        H. de Juego (Papudo): {chPapudo !== null ? chPapudo : '—'}
      </Text>


      {isAdmin && (
        <Button
          title="Agregar tarjeta"
          onPress={() => navigation.navigate('AddRound', { playerId })}
          color={colors.dark}
        />
      )}

      <FlatList
        data={rounds}
        keyExtractor={(r) => r.id}
        renderItem={({ item, index }) => {
          // Manejo defensivo del SD
          const sd = Number.isFinite(item?.score_differential as any)
            ? (item.score_differential as number).toFixed(1)
            : '—';

          // CALCULAR EL COURSE HANDICAP (CH) de la tarjeta
          // (Este se mantiene como estaba, usa los datos de la tarjeta)
          const ch = (hi !== null && Number.isFinite(hi))
            ? computeCourseHandicap(hi, item.course_rating, item.course_slope, item.course_par)
            : null;

          return (
            <View style={styles.row}>
              <View style={styles.indexPill}>
                <Text style={styles.indexTxt}>{index + 1}</Text>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.line1}>
                  {item.played_at} · {item.course_name}
                </Text>
                <Text style={styles.line2}>
                  CR: {item.course_rating} | Slope: {item.course_slope} | Par: {item.course_par} | PCC: {item.pcc}
                </Text>
                <Text style={styles.line3}>
                  Score: <Text style={styles.scoreText}>{item.adjusted_score}</Text> | SD: <Text style={styles.sdText}>{sd}</Text>
                </Text>
                {/* Este CH es el de LA TARJETA, lo cual es correcto y se mantiene */}
                <Text style={styles.lineCH}>
                  Hándicap de Juego (CH): <Text style={styles.chText}>{ch ?? 'N/A'}</Text>
                </Text>

                {isAdmin && (
                  <View style={styles.actions}>
                    <Button
                      title="Editar"
                      onPress={() => navigation.navigate('EditRound', { roundId: item.id })}
                      color={colors.dark}
                    />
                    <Button
                      title="Eliminar"
                      color="tomato"
                      onPress={() => deleteRound(item.id)}
                    />
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  // --- 5. Estilos ajustados ---
  hiTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
    // marginBottom: 8, // Movido
  },
  chTitle: { // Estilo nuevo
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 8, // Añadido
  },
  // --- Fin de ajuste ---
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colors.border, 
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  indexPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.light, 
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  indexTxt: {
    color: colors.dark, 
    fontWeight: '700',
    fontSize: 12,
  },
  cardBody: {
    flex: 1,
    gap: 4, 
  },
  line1: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.text,
    marginBottom: 2,
  },
  line2: {
    color: '#555',
    fontSize: 13,
  },
  line3: {
    color: '#333',
    fontSize: 14,
  },
  lineCH: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  scoreText: {
    fontWeight: '700',
    color: '#000',
    fontSize: 15,
  },
  sdText: {
    fontWeight: '700',
    color: '#000',
    fontSize: 15,
  },
  chText: {
    fontWeight: '800',
    color: colors.dark,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
});