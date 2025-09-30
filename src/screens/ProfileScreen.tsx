import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { supabase } from '../supabase';
import { Round } from '../types';
import { computeHandicapIndex } from '../utils/handicap';

export default function ProfileScreen(){
  const [rounds, setRounds] = useState<Round[]>([]);
  const [hi, setHi] = useState<number|null>(null);

  useEffect(()=>{ (async ()=>{
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('rounds')
      .select('*').eq('player_id', user.id)
      .order('played_at', { ascending:false }).order('created_at', { ascending:false });
    const rs = (data ?? []) as any;
    setRounds(rs);
    setHi(computeHandicapIndex(rs));
  })(); }, []);

  return (
    <View style={{flex:1, padding:12}}>
      <Text style={{fontSize:18, fontWeight:'700'}}>Mi Handicap: {hi ?? '—'}</Text>
      <FlatList data={rounds} keyExtractor={r=>r.id}
        renderItem={({item})=>(
          <View style={{padding:8, borderBottomWidth:1}}>
            <Text>{item.played_at} · {item.course_name} · SD {item.score_differential.toFixed(1)}</Text>
          </View>
        )}/>
    </View>
  );
}
