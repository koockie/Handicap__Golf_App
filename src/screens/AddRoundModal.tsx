import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { supabase } from '../supabase';

export default function AddRoundModal({ route, navigation }: any){
  const { playerId } = route.params;
  const [playedAt, setPlayedAt] = useState<string>(new Date().toISOString().slice(0,10));
  const [courseName, setCourseName] = useState('');
  const [cr, setCr] = useState('');
  const [slope, setSlope] = useState('');
  const [par, setPar] = useState('');
  const [pcc, setPcc] = useState('0');
  const [adj, setAdj] = useState('');

  const save = async ()=>{
    const CR = parseFloat(cr), S = parseFloat(slope), PAR = parseInt(par), PCC=parseFloat(pcc), ADJ=parseFloat(adj);
    if ([CR,S,PAR,ADJ].some(x=>!Number.isFinite(x))) return Alert.alert('Datos inválidos', 'Revisa números.');
    const { error } = await supabase.from('rounds').insert({
      player_id: playerId,
      played_at: playedAt,
      course_id: null,
      course_name: courseName || 'N/D',
      course_rating: CR,
      course_slope: S,
      course_par: PAR,
      pcc: PCC,
      adjusted_score: ADJ
    });
    if (error) return Alert.alert('Error', error.message);
    navigation.goBack();
  };

  return (
    <View style={{padding:16, gap:8}}>
      <TextInput placeholder="Fecha AAAA-MM-DD" value={playedAt} onChangeText={setPlayedAt} style={{borderWidth:1,padding:10,borderRadius:8}}/>
      <TextInput placeholder="Nombre campo/tee" value={courseName} onChangeText={setCourseName} style={{borderWidth:1,padding:10,borderRadius:8}}/>
      <TextInput placeholder="Course Rating" keyboardType="numeric" value={cr} onChangeText={setCr} style={{borderWidth:1,padding:10,borderRadius:8}}/>
      <TextInput placeholder="Course Slope" keyboardType="numeric" value={slope} onChangeText={setSlope} style={{borderWidth:1,padding:10,borderRadius:8}}/>
      <TextInput placeholder="Par" keyboardType="numeric" value={par} onChangeText={setPar} style={{borderWidth:1,padding:10,borderRadius:8}}/>
      <TextInput placeholder="PCC (opcional)" keyboardType="numeric" value={pcc} onChangeText={setPcc} style={{borderWidth:1,padding:10,borderRadius:8}}/>
      <TextInput placeholder="Score ajustado (18 hoyos)" keyboardType="numeric" value={adj} onChangeText={setAdj} style={{borderWidth:1,padding:10,borderRadius:8}}/>
      <Button title="Guardar" onPress={save}/>
    </View>
  );
}
