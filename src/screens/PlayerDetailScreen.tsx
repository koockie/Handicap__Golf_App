import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, Alert, StyleSheet } from 'react-native';
import { supabase } from '../supabase';
import { Round } from '../types';
import { computeHandicapIndex } from '../utils/handicap';
import { colors } from '../theme';

export default function PlayerDetailScreen({ route, navigation }: any){
  const { playerId, displayName } = route.params;
  const [rounds, setRounds] = useState<Round[]>([]);
  const [hi, setHi] = useState<number|null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = async ()=>{
    const { data: { user } } = await supabase.auth.getUser();
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
    setHi(computeHandicapIndex(rs));
  };

  useEffect(()=>{ load(); }, [playerId]);

  const deleteRound = async (id:string) => {
    const { error } = await supabase.from('rounds').delete().eq('id', id);
    if (error) return Alert.alert('Error', error.message);
    await load();
  };

  return (
    <View style={{flex:1, padding:12, gap:8}}>
      <Text style={{fontSize:18, fontWeight:'700'}}>
        {displayName} · Handicap (aprox WHS): {hi ?? '—'}
      </Text>

      {isAdmin && (
        <Button
          title="Agregar tarjeta"
          onPress={()=>navigation.navigate('AddRound', { playerId })}
        />
      )}

      <FlatList
        data={rounds}
        keyExtractor={(r)=>r.id}
        renderItem={({item, index})=>{
          // Manejo defensivo del SD si llegara null/undefined
          const sd = Number.isFinite(item?.score_differential as any)
            ? (item.score_differential as number).toFixed(1)
            : '—';

          return (
            <View style={styles.row}>
              {/* Número de tarjeta */}
              <View style={styles.indexPill}>
                <Text style={styles.indexTxt}>{index + 1}</Text>
                {/* Si prefieres que #1 sea la más antigua:
                    <Text style={styles.indexTxt}>{rounds.length - index}</Text> */}
              </View>

              {/* Contenido de la tarjeta */}
              <View style={styles.cardBody}>
                <Text style={styles.line1}>
                  {item.played_at} · {item.course_name}
                </Text>
                <Text style={styles.line2}>
                  AdjScore: {item.adjusted_score} | CR {item.course_rating} | S {item.course_slope} | PCC {item.pcc}
                </Text>
                <Text style={styles.line3}>
                  SD: {sd}
                </Text>

                {isAdmin && (
                  <View style={styles.actions}>
                    <Button
                      title="Editar"
                      onPress={()=>navigation.navigate('EditRound', { roundId: item.id })}
                      color={colors.dark}
                    />
                    <Button
                      title="Eliminar"
                      color="tomato"
                      onPress={()=>deleteRound(item.id)}
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#e6e6e6',
  },
  indexPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  indexTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  cardBody: {
    flex: 1,
  },
  line1: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  line2: {
    color: '#555',
  },
  line3: {
    color: '#333',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
});
