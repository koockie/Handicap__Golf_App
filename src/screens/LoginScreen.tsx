import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { supabase } from '../supabase';

export default function LoginScreen() {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error', error.message);
  };

  return (
    <View style={{padding:16, gap:12}}>
      <Text style={{fontSize:22, fontWeight:'700'}}>Ingresar</Text>
      <TextInput placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail}
        style={{borderWidth:1,padding:10,borderRadius:8}}/>
      <TextInput placeholder="Clave" secureTextEntry value={password} onChangeText={setPassword}
        style={{borderWidth:1,padding:10,borderRadius:8}}/>
      <Button title="Iniciar sesión" onPress={signIn}/>
    </View>
  );
}
