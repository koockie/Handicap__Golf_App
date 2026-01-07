import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  ImageBackground, 
  Modal, 
  KeyboardAvoidingView, 
  Platform, 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase';
import { colors } from '../theme';

export default function AdminHomeScreen() {
  const nav = useNavigation<any>();

  // Estado para mostrar/ocultar el formulario (Modal)
  const [modalVisible, setModalVisible] = useState(false);

  // Estados del formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Lógica para crear jugador
  const createPlayer = async () => {
    if (!name.trim() || !email.trim()) {
      return Alert.alert('Faltan datos', 'Ingresa Nombre y Email.');
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .insert({
          display_name: name.trim(),
          email: email.trim().toLowerCase(),
          role: 'player',
          user_id: null 
        });

      if (error) throw error;

      Alert.alert(
        '¡Éxito!', 
        `Jugador "${name}" creado.\nEmail de registro: ${email}`,
        [{ text: "OK", onPress: () => {
            setModalVisible(false); // Cierra el modal y limpia
            setName('');
            setEmail('');
        }}]
      );
      
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => supabase.auth.signOut() }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 1. FONDO PRINCIPAL LOCAL */}
      <ImageBackground
        source={require('../../assets/fondo.jpg')} 
        style={styles.background}
        resizeMode="cover"
      >
        {/* Gradiente para oscurecer y dar elegancia */}
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Panel de Control</Text>
            <Text style={styles.headerSubtitle}>ADMINISTRADOR</Text>
          </View>

          {/* --- MENÚ DE 3 TARJETAS --- */}
          <View style={styles.menuContainer}>

            {/* TARJETA 1: CREAR JUGADOR (Abre Modal) */}
            <TouchableOpacity 
              style={styles.cardContainer} 
              activeOpacity={0.9}
              onPress={() => setModalVisible(true)}
            >
              <ImageBackground
                // NOTA: Puedes cambiar esta uri por require('../../pics_demoo/tu_imagen.jpg')
                source={require('../../assets/boton_nuevo_jugador.jpg')}
                style={styles.cardImage}
                imageStyle={{ borderRadius: 16 }}
              >
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardGradient}>
                  <Text style={styles.cardTitle}>+ Nuevo Jugador</Text>
                  <Text style={styles.cardDesc}>Registrar socio en el sistema</Text>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>

            {/* TARJETA 2: LISTA JUGADORES (Navega) */}
            <TouchableOpacity 
              style={styles.cardContainer} 
              activeOpacity={0.9}
              onPress={() => nav.navigate('Players')}
            >
              <ImageBackground
                source={require('../../assets/boton_lista.jpg')}
                style={styles.cardImage}
                imageStyle={{ borderRadius: 16 }}
              >
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardGradient}>
                  <Text style={styles.cardTitle}>Lista de Jugadores</Text>
                  <Text style={styles.cardDesc}>Gestionar y cargar tarjetas</Text>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>

            {/* TARJETA 3: RANKING (Navega) */}
            <TouchableOpacity 
              style={styles.cardContainer} 
              activeOpacity={0.9}
              onPress={() => nav.navigate('Ranking')}
            >
              <ImageBackground
                source={require('../../assets/boton_ranking.png')}
                style={styles.cardImage}
                imageStyle={{ borderRadius: 16 }}
              >
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardGradient}>
                  <Text style={styles.cardTitle}>Ver Ranking</Text>
                  <Text style={styles.cardDesc}>Tabla de posiciones actual</Text>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>

          </View>

          {/* LOGOUT SUTIL */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>

        </LinearGradient>
      </ImageBackground>

      {/* --- MODAL (VENTANA EMERGENTE) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alta de Nuevo Jugador</Text>
            <Text style={styles.modalSubtitle}>Crea el perfil para luego cargarle tarjetas.</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre Completo</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: Juan Pérez"
                    value={name}
                    onChangeText={setName}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo Electrónico</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: juan.perez@gmail.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <TouchableOpacity 
                style={styles.createButton} 
                onPress={createPlayer}
                disabled={loading}
            >
                <Text style={styles.createButtonText}>{loading ? "Guardando..." : "GUARDAR JUGADOR"}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setModalVisible(false)}
            >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, width: '100%' },
  gradient: { flex: 1, padding: 20, justifyContent: 'center' },
  
  header: { marginBottom: 30, marginTop: 40, alignItems: 'center' },
  headerTitle: { fontSize: 30, fontWeight: '800', color: '#fff', textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', letterSpacing: 3, marginTop: 5 },

  menuContainer: { gap: 20, flex: 1, justifyContent: 'center' },

  // ESTILOS DE LAS TARJETAS
  cardContainer: {
    height: 120, // Altura de cada botón
    width: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    overflow: 'hidden', // Para que la imagen respete el borde
  },
  cardImage: { flex: 1, justifyContent: 'flex-end' },
  cardGradient: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  cardTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 3 },
  cardDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2 },

  // LOGOUT
  logoutBtn: { padding: 20, alignItems: 'center', marginBottom: 10 },
  logoutText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },

  // ESTILOS DEL MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // Fondo oscuro semitransparente
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 24,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.dark, textAlign: 'center', marginBottom: 5 },
  modalSubtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 25 },
  
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 6, textTransform: 'uppercase', marginLeft: 4 },
  input: {
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333'
  },
  
  createButton: {
    backgroundColor: colors.dark,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  createButtonText: { color: '#fff', fontWeight: 'bold', letterSpacing: 1, fontSize: 16 },
  
  cancelButton: { padding: 15, alignItems: 'center', marginTop: 5 },
  cancelButtonText: { color: '#999', fontWeight: '600' }
});