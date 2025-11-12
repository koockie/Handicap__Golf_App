import React, { useState, useEffect, useMemo } from 'react';
import { View, TextInput, Button, Alert, Text, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../supabase';
import { colors } from '../theme';
import { computeScoreDifferential } from '../utils/handicap';

export default function EditRoundModal({ route, navigation }: any){
  const { roundId } = route.params;
  const [playedAt, setPlayedAt] = useState('');
  const [courseName, setCourseName] = useState(''); 
  const [cr, setCr] = useState('');
  const [slope, setSlope] = useState('');
  const [par, setPar] = useState('');
  const [pcc, setPcc] = useState('0');
  const [adj, setAdj] = useState('');

  useEffect(()=>{ (async ()=>{
    const { data, error } = await supabase.from('rounds').select('*').eq('id', roundId).maybeSingle();
    if (error || !data) { Alert.alert('Error', error?.message || 'No encontrada'); return; }
    setPlayedAt(data.played_at);
    setCourseName(data.course_name ?? ''); 
    setCr(String(data.course_rating ?? ''));
    setSlope(String(data.course_slope ?? ''));
    setPar(String(data.course_par ?? ''));
    setPcc(String(data.pcc ?? '0'));
    setAdj(String(data.adjusted_score ?? ''));
  })(); }, [roundId]);

  // Preview de SD (solo lectura)
  const sdPreview = useMemo(() => {
    const CR  = parseFloat(cr);
    const S   = parseFloat(slope);
    const PCC = parseFloat(pcc || '0');
    const ADJ = parseFloat(adj);
    if (![CR, S, ADJ].every(Number.isFinite) || S <= 0) return null;
    return computeScoreDifferential(ADJ, CR, S, Number.isFinite(PCC) ? PCC : 0);
  }, [cr, slope, pcc, adj]);

  const save = async ()=>{
    const CR  = parseFloat(cr);
    const S   = parseFloat(slope);
    const PAR = parseInt(par);
    const PCC = parseFloat(pcc || '0');
    const ADJ = parseFloat(adj);

    if (![CR, S, PAR, ADJ].every(Number.isFinite) || S <= 0) {
      return Alert.alert('Datos inválidos', 'Revisa números y que Slope > 0.');
    }

    const { error } = await supabase.from('rounds').update({
      played_at: playedAt,
      course_rating: CR,
      course_slope: S,
      course_par: PAR,
      pcc: Number.isFinite(PCC) ? PCC : 0,
      adjusted_score: ADJ
      // score_differential lo recalcula la BD (GENERATED ALWAYS)
    }).eq('id', roundId);

    if (error) return Alert.alert('Error', error.message);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <LabeledInput label="Fecha" hint="AAAA-MM-DD">
        <TextInput
          placeholder="2025-10-10"
          value={playedAt}
          onChangeText={setPlayedAt}
          style={styles.input}
          autoCapitalize="none"
        />
      </LabeledInput>

      <LabeledInput label="Campo/Tee">
        <Text style={styles.courseNameText}>{courseName || 'N/D'}</Text>
      </LabeledInput>

      <LabeledInput label="Course Rating">
        <TextInput
          placeholder="65.6"
          keyboardType="numeric"
          value={cr}
          onChangeText={setCr}
          style={styles.input}
        />
      </LabeledInput>

      <LabeledInput label="Slope">
        <TextInput
          placeholder="115"
          keyboardType="numeric"
          value={slope}
          onChangeText={setSlope}
          style={styles.input}
        />
      </LabeledInput>

      <LabeledInput label="Par">
        <TextInput
          placeholder="68"
          keyboardType="numeric"
          value={par}
          onChangeText={setPar}
          style={styles.input}
        />
      </LabeledInput>

      <LabeledInput label="PCC">
        <TextInput
          placeholder="0"
          keyboardType="numeric"
          value={pcc}
          onChangeText={setPcc}
          style={styles.input}
        />
      </LabeledInput>

      <LabeledInput label="Score ajustado (Golpes realizados)">
        <TextInput
          placeholder="0"
          keyboardType="numeric"
          value={adj}
          onChangeText={setAdj}
          style={styles.input}
        />
      </LabeledInput>

      <Text style={styles.preview}>
        SD (preview):{' '}
        <Text style={styles.previewStrong}>{sdPreview ?? '—'}</Text>
      </Text>

      <Button title="Guardar cambios" onPress={save} color={colors.dark}/>
    </ScrollView>
  );
}

/** ---------- Componente de fila con label a la izquierda ---------- */
function LabeledInput({
  label,
  hint,
  children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.labelBox}>
        <Text style={styles.label}>{label}</Text>
        {!!hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.bg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  labelBox: {
    width: 130,
  },
  label: {
    fontWeight: '700',
    color: colors.text,
  },
  hint: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  // --- 3. Estilo para el texto del nombre del club ---
  courseNameText: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: '#f4f4f4',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
  },
  preview: { color: '#674444ff', marginBottom: 8 },
  previewStrong: { fontWeight: '700', color: colors.text },
});