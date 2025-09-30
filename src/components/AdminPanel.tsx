import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, LayoutAnimation, Platform, UIManager, StyleSheet, Alert } from 'react-native';
import { supabase } from '../supabase';
import { colors } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AdminPanel(){
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'admin'|'player'>('player');

  const toggle = ()=>{ LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setOpen(!open) }

  const invite = async ()=>{
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { email, displayName, role }
    });
    if (error) return Alert.alert('Error', error.message);
    Alert.alert('Listo', 'Usuario creado: ' + data.userId);
    setEmail(''); setDisplayName(''); setRole('player');
  }

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.header} onPress={toggle}>
        <Text style={styles.headerText}>Administrar usuarios</Text>
        <Text style={styles.headerText}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.body}>
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail}/>
          <TextInput style={styles.input} placeholder="Nombre (opcional)" value={displayName} onChangeText={setDisplayName}/>
          <View style={{flexDirection:'row', gap:12}}>
            <TouchableOpacity onPress={()=>setRole('player')} style={[styles.roleBtn, role==='player' && styles.roleBtnActive]}><Text style={styles.roleTxt}>Player</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>setRole('admin')} style={[styles.roleBtn, role==='admin' && styles.roleBtnActive]}><Text style={styles.roleTxt}>Admin</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.inviteBtn} onPress={invite}><Text style={{color:'#fff', fontWeight:'700'}}>Invitar / Crear</Text></TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom:12, borderRadius:14, overflow:'hidden', borderWidth:1, borderColor: colors.border, backgroundColor:'#fff' },
  header: { padding:12, backgroundColor: colors.dark, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  headerText: { color:'#fff', fontWeight:'700' },
  body: { padding:12, gap:10 },
  input: { borderWidth:1, borderColor: colors.border, borderRadius:10, padding:10, backgroundColor:'#fff' },
  roleBtn: { borderWidth:1, borderColor: colors.border, borderRadius:999, paddingVertical:6, paddingHorizontal:12, backgroundColor:'#fff' },
  roleBtnActive: { backgroundColor: colors.light },
  roleTxt: { color: colors.text },
  inviteBtn: { marginTop:8, backgroundColor: colors.dark, padding:12, borderRadius:10, alignItems:'center' }
});
