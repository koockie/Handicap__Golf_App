import React, { useMemo, useState } from 'react';
import { View, TextInput, Button, Alert, Text, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../supabase';
import { colors } from '../theme';
import { computeScoreDifferential } from '../utils/handicap';

// --- 1. Definir el nombre del club aquí ---
const CLUB_NAME = "Club de Golf Papudo";

export default function AddRoundModal({ route, navigation }: any){
  const { playerId } = route.params || {};
  const [playedAt, setPlayedAt] = useState<string>(new Date().toISOString().slice(0,10));
  // --- 2. Quitar el useState de courseName ---
  // const [courseName, setCourseName] = useState(''); 
  const [cr, setCr] = useState('65.6');    // defaults iniciales
  const [slope, setSlope] = useState('115');
  const [par, setPar] = useState('68');
  const [pcc, setPcc] = useState('0');
  const [adj, setAdj] = useState('');

  // Preview de SD (solo lectura)
  const sdPreview = useMemo(() => {
    const CR  = parseFloat(cr);
    const S   = parseFloat(slope);
    const PCC = parseFloat(pcc || '0');
    const ADJ = parseFloat(adj);
    if (![CR, S, ADJ].every(Number.isFinite) || S <= 0) return null;
    return computeScoreDifferential(ADJ, CR, S, Number.isFinite(PCC) ? PCC : 0);
  }, [cr, slope, pcc, adj]);

  const save = async () => {
    try {
      const CR  = parseFloat(cr);
      const S   = parseFloat(slope);
      const PAR = parseInt(par);
      const PCC = parseFloat(pcc || '0');
      const ADJ = parseFloat(adj);

      if (![CR, S, PAR, ADJ].every(Number.isFinite) || S <= 0) {
        return Alert.alert('Datos inválidos', 'Revisa números y que Slope > 0.');
      }

      // Si no pasaron playerId desde la ruta, usa el usuario autenticado
      let ownerId = playerId;
      if (!ownerId) {
        const { data: { user } } = await supabase.auth.getUser();
        ownerId = user?.id;
      }
      if (!ownerId) return Alert.alert('Error', 'No se encontró el jugador.');

      const { error } = await supabase.from('rounds').insert({
        player_id: ownerId,
        played_at: playedAt,
        course_id: null,
        course_name: CLUB_NAME, // <-- 3. Usar el valor harcodeado
        course_rating: CR,
        course_slope: S,
        course_par: PAR,
        pcc: Number.isFinite(PCC) ? PCC : 0,
        adjusted_score: ADJ
        // score_differential lo calcula la BD (GENERATED ALWAYS)
      });
      if (error) throw error;

      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar la tarjeta.');
    }
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

      {/* --- 4. Reemplazar TextInput por Text --- */}
      <LabeledInput label="Campo/Tee">
        <Text style={styles.courseNameText}>{CLUB_NAME}</Text>
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

      <Button title="Guardar" onPress={save} color={colors.dark}/>
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
    width: 130, // ancho fijo para alinear todas las etiquetas
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
  // --- 5. Estilo para el texto del nombre del club ---
  courseNameText: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: '#f4f4f4', // Un fondo gris claro para que parezca "deshabilitado"
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
  },
  preview: { color: '#666', marginBottom: 8 },
  previewStrong: { fontWeight: '700', color: colors.text },
});