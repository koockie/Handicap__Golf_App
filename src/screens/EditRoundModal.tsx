import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { supabase } from '../supabase';
import { colors } from '../theme';

export default function EditRoundModal({ route, navigation }: any){
  const { roundId } = route.params;
  const [playedAt, setPlayedAt] = useState('');
  const [courseName, setCourseName] = useState('');
  const [cr, setCr] = useState(''); const [slope, setSlope] = useState('');
  const [par, setPar] = useState(''); const [pcc, setPcc] = useState('0');
  const [adj, setAdj] = useState('');

  useEffect(()=>{ (async ()=>{
    const { data, error } = await supabase.from('rounds').select('*').eq('id', roundId).maybeSingle();
    if (error || !data) { Alert.alert('Error', error?.message || 'No encontrada'); return; }
    setPlayedAt(data.played_at); setCourseName(data.course_name);
    setCr(String(data.course_rating)); setSlope(String(data.course_slope));
    setPar(String(data.course_par)); setPcc(String(data.pcc));
    setAdj(String(data.adjusted_score));
  })(); }, [roundId]);

  const save = async ()=>{
    const CR = parseFloat(cr), S = parseFloat(slope), PAR = parseInt(par), PCC=parseFloat(pcc), ADJ=parseFloat(adj);
    if ([CR,S,PAR,ADJ].some(x=>!Number.isFinite(x))) return Alert.alert('Datos inválidos', 'Revisa números.');
    const { error } = await supabase.from('rounds').update({
      played_at: playedAt, course_name: courseName || 'N/D', course_rating: CR,
      course_slope: S, course_par: PAR, pcc: PCC, adjusted_score: ADJ
    }).eq('id', roundId);
    if (error) return Alert.alert('Error', error.message);
    navigation.goBack();
  };

  return (
    <View style={{padding:16, gap:8, backgroundColor: colors.bg, flex:1}}>
      <TextInput placeholder="Fecha AAAA-MM-DD" value={playedAt} onChangeText={setPlayedAt} style={{borderWidth:1,padding:10,borderRadius:8, backgroundColor:'#fff'}}/>
      <TextInput placeholder="Nombre campo/tee" value={courseName} onChangeText={setCourseName} style={{borderWidth:1,padding:10,borderRadius:8, backgroundColor:'#fff'}}/>
      <TextInput placeholder="Course Rating" keyboardType="numeric" value={cr} onChangeText={setCr} style={{borderWidth:1,padding:10,borderRadius:8, backgroundColor:'#fff'}}/>
      <TextInput placeholder="Course Slope" keyboardType="numeric" value={slope} onChangeText={setSlope} style={{borderWidth:1,padding:10,borderRadius:8, backgroundColor:'#fff'}}/>
      <TextInput placeholder="Par" keyboardType="numeric" value={par} onChangeText={setPar} style={{borderWidth:1,padding:10,borderRadius:8, backgroundColor:'#fff'}}/>
      <TextInput placeholder="PCC" keyboardType="numeric" value={pcc} onChangeText={setPcc} style={{borderWidth:1,padding:10,borderRadius:8, backgroundColor:'#fff'}}/>
      <TextInput placeholder="Score ajustado" keyboardType="numeric" value={adj} onChangeText={setAdj} style={{borderWidth:1,padding:10,borderRadius:8, backgroundColor:'#fff'}}/>
      <Button title="Guardar cambios" onPress={save} color={colors.dark}/>
    </View>
  );
}
