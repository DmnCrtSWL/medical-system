import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, StatusBar } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { NewConsultationScreen } from './src/screens/NewConsultationScreen';
import { authService } from './src/services/auth';
import { DoctorUser } from './src/types';

type ActiveScreen = 'HOME' | 'NEW_CONSULTATION';

export default function App() {
  const [user, setUser] = useState<DoctorUser | null>(null);
  const [, setToken] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('HOME');

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
    setCurrentScreen('HOME');
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
    setCurrentScreen('HOME');
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
      {!user ? (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      ) : currentScreen === 'HOME' ? (
        <HomeScreen
          user={user}
          onLogout={handleLogout}
          onNavigateToNewConsultation={() => setCurrentScreen('NEW_CONSULTATION')}
        />
      ) : (
        <NewConsultationScreen
          onBack={() => setCurrentScreen('HOME')}
          onSaveSuccess={() => setCurrentScreen('HOME')}
        />
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
