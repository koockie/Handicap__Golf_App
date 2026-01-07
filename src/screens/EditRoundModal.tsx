// src/screens/EditRoundModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, TextInput, Alert, Text, StyleSheet, ScrollView, 
  ImageBackground, KeyboardAvoidingView, Platform, TouchableOpacity 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  // Eliminamos pcc del formulario visible (se mantendrá 0 por defecto si no existe)
  const [adj, setAdj] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ (async ()=>{
    const { data, error } = await supabase.from('rounds').select('*').eq('id', roundId).maybeSingle();
    if (error || !data) { Alert.alert('Error', error?.message || 'No encontrada'); return; }
    
    setPlayedAt(data.played_at);
    setCourseName(data.course_name ?? ''); 
    setCr(String(data.course_rating ?? ''));
    setSlope(String(data.course_slope ?? ''));
    setPar(String(data.course_par ?? ''));
    setAdj(String(data.adjusted_score ?? ''));
  })(); }, [roundId]);

  // Preview de SD (solo lectura)
  const sdPreview = useMemo(() => {
    const CR  = parseFloat(cr);
    const S   = parseFloat(slope);
    const ADJ = parseFloat(adj);
    // Asumimos PCC = 0
    if (![CR, S, ADJ].every(Number.isFinite) || S <= 0) return null;
    return computeScoreDifferential(ADJ, CR, S, 0);
  }, [cr, slope, adj]);

  const save = async ()=>{
    try {
      setLoading(true);
      const CR  = parseFloat(cr);
      const S   = parseFloat(slope);
      const PAR = parseInt(par);
      const ADJ = parseFloat(adj);

      if (![CR, S, PAR, ADJ].every(Number.isFinite) || S <= 0) {
        setLoading(false);
        return Alert.alert('Datos inválidos', 'Revisa números y que Slope > 0.');
      }

      const { error } = await supabase.from('rounds').update({
        played_at: playedAt,
        course_rating: CR,
        course_slope: S,
        course_par: PAR,
        pcc: 0, // Forzamos 0 o mantenemos lógica interna
        adjusted_score: ADJ
      }).eq('id', roundId);

      if (error) throw error;
      
      navigation.goBack();
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e.message);
    }
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            {/* TARJETA BLANCA SEMITRANSPARENTE */}
            <View style={styles.card}>
              <Text style={styles.title}>Editar Tarjeta</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Fecha de Juego</Text>
                <TextInput
                  placeholder="AAAA-MM-DD"
                  value={playedAt}
                  onChangeText={setPlayedAt}
                  style={styles.input}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Cancha</Text>
                <View style={styles.disabledInput}>
                    <Text style={styles.disabledText}>{courseName || 'Cargando...'}</Text>
                </View>
              </View>

              {/* FILA DE 3 COLUMNAS PARA DATOS TÉCNICOS */}
              <View style={styles.row3}>
                <View style={[styles.formGroup, {flex:1}]}>
                  <Text style={styles.label}>CR</Text>
                  <TextInput
                    placeholder="65.6"
                    keyboardType="numeric"
                    value={cr}
                    onChangeText={setCr}
                    style={styles.input}
                  />
                </View>
                <View style={[styles.formGroup, {flex:1}]}>
                  <Text style={styles.label}>Slope</Text>
                  <TextInput
                    placeholder="115"
                    keyboardType="numeric"
                    value={slope}
                    onChangeText={setSlope}
                    style={styles.input}
                  />
                </View>
                <View style={[styles.formGroup, {flex:1}]}>
                  <Text style={styles.label}>Par</Text>
                  <TextInput
                    placeholder="68"
                    keyboardType="numeric"
                    value={par}
                    onChangeText={setPar}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.formGroup}>
                <Text style={[styles.label, {color: colors.dark, fontSize: 14}]}>SCORE BRUTO (GOLPES)</Text>
                <TextInput
                  placeholder="Ej: 72"
                  keyboardType="numeric"
                  value={adj}
                  onChangeText={setAdj}
                  style={[styles.input, styles.scoreInput]}
                />
              </View>

              {/* PREVIEW */}
              {sdPreview !== null && (
                 <View style={styles.previewBox}>
                    <Text style={styles.previewText}>
                        Nuevo Diferencial (SD): <Text style={{fontWeight:'bold'}}>{sdPreview}</Text>
                    </Text>
                 </View>
              )}

              <TouchableOpacity 
                style={[styles.saveButton, loading && {opacity: 0.7}]}
                onPress={save}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                    {loading ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                </Text>
              </TouchableOpacity>

            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%' },
  gradient: { flex: 1 },
  scrollContent: { padding: 20, justifyContent: 'center', minHeight: '100%' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.dark, textAlign: 'center', marginBottom: 24 },
  
  formGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    padding: 14, fontSize: 16, color: '#333'
  },
  disabledInput: {
    backgroundColor: '#eee', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#ddd'
  },
  disabledText: { color: '#666', fontWeight: '600' },

  row3: { flexDirection: 'row', gap: 10 },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },

  scoreInput: {
    borderColor: colors.dark, borderWidth: 2, backgroundColor: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center'
  },

  previewBox: {
    backgroundColor: '#e6fffa', padding: 10, borderRadius: 8, marginBottom: 20, alignItems: 'center'
  },
  previewText: { color: colors.dark, fontSize: 14 },

  saveButton: {
    backgroundColor: colors.dark,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.dark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4,
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
});