// src/screens/PlayerDetailScreen.tsx
import React, { useEffect, useState, useCallback } from 'react'; // <-- 1. IMPORTAR useCallback
import { View, Text, FlatList, Button, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // <-- 2. IMPORTAR useFocusEffect
import { supabase } from '../supabase';
import { Round } from '../types';
import { computeHandicapIndex, computeCourseHandicap } from '../utils/handicap';
import { colors } from '../theme';

const PAPUDO_CR = 65.6;
const PAPUDO_SR = 115;
const PAPUDO_PAR = 68; 

export default function PlayerDetailScreen({ route, navigation }: any) {
  const { playerId, displayName } = route.params;
  const [rounds, setRounds] = useState<Round[]>([]);
  const [hi, setHi] = useState<number | null>(null);
  const [chPapudo, setChPapudo] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- 3. Envolver 'load' en useCallback ---
  const load = useCallback(async () => {
    // (Esta función es async, devuelve Promise<void>)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; 

    // (Separamos la lógica de isAdmin para que no se recargue innecesariamente)

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
  }, [playerId]); // 'playerId' es la dependencia

  // --- 4. CORRECCIÓN DE useFocusEffect ---
  useFocusEffect(
    useCallback(() => {
      // Esta función interna es síncrona (devuelve void)
      load(); // Y llama a nuestra función async
    }, [load]) // Depende de la función 'load' memoizada
  );

  // El useEffect para cargar el rol de admin solo se ejecuta una vez
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
  }, []); // Se mantiene como estaba

  const deleteRound = async (id: string) => {
    const { error } = await supabase.from('rounds').delete().eq('id', id);
    if (error) return Alert.alert('Error', error.message);
    await load(); // Recargar tras eliminar
  };

  return (
    <View style={{ flex: 1, padding: 12, gap: 8 }}>
      <Text style={styles.title}>
        {displayName}
      </Text>
      <Text style={styles.hiTitle}>
        Hándicap Index (HI): {hi !== null ? hi.toFixed(1) : '—'}
      </Text>
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
          const sd = Number.isFinite(item?.score_differential as any)
            ? (item.score_differential as number).toFixed(1)
            : '—';

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
  hiTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
  },
  chTitle: { // Estilo nuevo
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 8, 
  },
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