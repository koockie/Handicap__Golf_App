import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, Alert } from 'react-native';
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
    const { data: me } = await supabase.from('profiles').select('role').eq('user_id', user!.id).maybeSingle();
    setIsAdmin(me?.role === 'admin');

    const { data, error } = await supabase
      .from('rounds').select('*')
      .eq('player_id', playerId)
      .order('played_at', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) { Alert.alert('Error', error.message); return; }
    const rs = (data ?? []) as any;
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
      {isAdmin && <Button title="Agregar tarjeta" onPress={()=>navigation.navigate('AddRound', { playerId })}/>}

      <FlatList
        data={rounds}
        keyExtractor={r=>r.id}
        renderItem={({item})=>(
          <View style={{padding:10, borderBottomWidth:1}}>
            <Text>{item.played_at} · {item.course_name}</Text>
            <Text>AdjScore: {item.adjusted_score} | CR {item.course_rating} | S {item.course_slope} | PCC {item.pcc}</Text>
            <Text>SD: {item.score_differential.toFixed(1)}</Text>
            {isAdmin && (
              <View style={{flexDirection:'row', gap:12, marginTop:6}}>
                <Button title="Editar" onPress={()=>navigation.navigate('EditRound', { roundId: item.id })} color={colors.dark}/>
                <Button title="Eliminar" color="tomato" onPress={()=>deleteRound(item.id)}/>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}
