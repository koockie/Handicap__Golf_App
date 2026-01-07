// src/screens/ProfileScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, ImageBackground, Animated, ActivityIndicator, Dimensions, TouchableOpacity 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import { supabase } from '../supabase';
import { computeHandicapIndex } from '../utils/handicap';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [hi, setHi] = useState<number | null>(null);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const slideAnim = useRef(new Animated.Value(50)).current; 

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Nombre
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();
      if (profile) setDisplayName(profile.display_name);

      // 2. Hándicap
      const { data: rounds } = await supabase
        .from('rounds')
        .select('*')
        .eq('player_id', user.id)
        .order('played_at', { ascending: false });
      
      const calculatedHi = computeHandicapIndex(rounds || []);
      setHi(calculatedHi);

      // 3. Animar entrada
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 6,
          useNativeDriver: true,
        })
      ]).start();

    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.dark} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/fondo.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
              
              <Text style={styles.welcomeText}>Hola,</Text>
              <Text style={styles.nameText}>{displayName || 'Jugador'}</Text>

              {/* TARJETA DE HÁNDICAP */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLabel}>HANDICAP ACTUAL</Text>
                  <View style={styles.dot} /> 
                </View>
                
                <Text style={styles.handicapNumber}>
                  {hi !== null ? hi.toFixed(1) : '—'}
                </Text>
                
                <View style={styles.divider} />
                
                <Text style={styles.cardFooter}>
                  Club de Golf Papudo
                </Text>
              </View>

              {/* SOLO BOTÓN DE SALIR */}
              <TouchableOpacity 
                onPress={handleLogout} 
                style={styles.logoutButton}
              >
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
              </TouchableOpacity>

            </Animated.View>

          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  background: { flex: 1, width: '100%', height: '100%' },
  gradient: { flex: 1, justifyContent: 'center', padding: 20 },
  content: { alignItems: 'center', width: '100%' },
  
  welcomeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 24,
    fontWeight: '300',
    marginBottom: 5,
  },
  nameText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  card: {
    width: width * 0.85,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10, 
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  cardLabel: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dark, 
  },
  handicapNumber: {
    fontSize: 80,
    fontWeight: '900',
    color: colors.dark, 
    letterSpacing: -2,
    includeFontPadding: false,
  },
  divider: {
    width: '40%',
    height: 2,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  cardFooter: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  logoutButton: {
    marginTop: 40,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  }
});