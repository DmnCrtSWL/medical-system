import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, StatusBar } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { authService } from './src/services/auth';
import { DoctorUser } from './src/types';

export default function App() {
  const [user, setUser] = useState<DoctorUser | null>(null);
  const [, setToken] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  // Restaurar sesión persistida al iniciar la app
  useEffect(() => {
    const checkSession = async () => {
      try {
        const stored = await authService.getStoredSession();
        if (stored) {
          setUser(stored.user);
          setToken(stored.token);
        }
      } catch {
        // En caso de error al leer almacenamiento, continuar en pantalla de login
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleLoginSuccess = (authenticatedUser: DoctorUser, authToken: string) => {
    setUser(authenticatedUser);
    setToken(authToken);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  };

  // Pantalla de carga mientras se verifica la sesión en AsyncStorage
  if (isCheckingSession) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <ActivityIndicator size="large" color="#34D399" />
        <Text style={styles.loadingText}>Iniciando MedSys Mobile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {user ? (
        <HomeScreen user={user} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 16,
    fontWeight: '500',
  },
});
