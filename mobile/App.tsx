import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { NewConsultationScreen } from './src/screens/NewConsultationScreen';
import { PatientsListScreen } from './src/screens/PatientsListScreen';
import { PatientHistoryScreen } from './src/screens/PatientHistoryScreen';
import { authService } from './src/services/auth';
import { syncEngine } from './src/services/syncEngine';
import { DoctorUser, PatientSummary } from './src/types';

type ActiveScreen = 'HOME' | 'PATIENTS_LIST' | 'PATIENT_HISTORY' | 'NEW_CONSULTATION';

interface PrefilledPatientData {
  name: string;
  companyName?: string;
  employeeNumber?: string;
  age?: number;
}

export default function App() {
  const [user, setUser] = useState<DoctorUser | null>(null);
  const [, setToken] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('HOME');
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [prefilledPatientData, setPrefilledPatientData] = useState<PrefilledPatientData | null>(null);
  const { width } = useWindowDimensions();
  const isLargeScreen = Platform.OS === 'web' && width > 500;

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

  // Intento de sincronización automática en segundo plano cuando el médico está autenticado
  useEffect(() => {
    if (user) {
      const runBackgroundSync = async () => {
        const isOnline = await syncEngine.checkServerConnection();
        if (isOnline) {
          try {
            await syncEngine.syncPendingConsultations();
          } catch {
            // Sincronización silenciosa en background sin interrumpir la experiencia del usuario
          }
        }
      };

      runBackgroundSync();
    }
  }, [user]);

  const handleLoginSuccess = (authenticatedUser: DoctorUser, authToken: string) => {
    setUser(authenticatedUser);
    setToken(authToken);
    setCurrentScreen('HOME');
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
    setSelectedPatient(null);
    setPrefilledPatientData(null);
    setCurrentScreen('HOME');
  };

  const handleConsultationSaved = () => {
    // Al guardar una consulta, intentar sincronizar de inmediato si hay conexión
    syncEngine.checkServerConnection().then((isOnline) => {
      if (isOnline) {
        syncEngine.syncPendingConsultations().catch(() => {});
      }
    });

    if (selectedPatient) {
      setCurrentScreen('PATIENT_HISTORY');
    } else {
      setCurrentScreen('HOME');
    }
  };

  const handleOpenNewConsultation = () => {
    setPrefilledPatientData(null);
    setCurrentScreen('NEW_CONSULTATION');
  };

  const handleOpenPatientsList = () => {
    setCurrentScreen('PATIENTS_LIST');
  };

  const handleSelectPatient = (patient: PatientSummary) => {
    setSelectedPatient(patient);
    setCurrentScreen('PATIENT_HISTORY');
  };

  const handleNewConsultationForPatient = (patientInfo: PrefilledPatientData) => {
    setPrefilledPatientData(patientInfo);
    setCurrentScreen('NEW_CONSULTATION');
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

  const renderActiveScreen = () => {
    if (!user) {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    switch (currentScreen) {
      case 'HOME':
        return (
          <HomeScreen
            user={user}
            onLogout={handleLogout}
            onNavigateToNewConsultation={handleOpenNewConsultation}
            onNavigateToPatients={handleOpenPatientsList}
          />
        );
      case 'PATIENTS_LIST':
        return (
          <PatientsListScreen
            onBack={() => setCurrentScreen('HOME')}
            onSelectPatient={handleSelectPatient}
            onNewConsultation={handleOpenNewConsultation}
          />
        );
      case 'PATIENT_HISTORY':
        return (
          <PatientHistoryScreen
            patientId={selectedPatient?.id || ''}
            patientName={selectedPatient?.name}
            onBack={() => setCurrentScreen('PATIENTS_LIST')}
            onNewConsultationForPatient={handleNewConsultationForPatient}
          />
        );
      case 'NEW_CONSULTATION':
        return (
          <NewConsultationScreen
            user={user}
            initialPatientData={prefilledPatientData}
            onBack={() => {
              if (selectedPatient) {
                setCurrentScreen('PATIENT_HISTORY');
              } else {
                setCurrentScreen('HOME');
              }
            }}
            onSaveSuccess={handleConsultationSaved}
          />
        );
      default:
        return (
          <HomeScreen
            user={user}
            onLogout={handleLogout}
            onNavigateToNewConsultation={handleOpenNewConsultation}
            onNavigateToPatients={handleOpenPatientsList}
          />
        );
    }
  };

  const appContent = (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      {renderActiveScreen()}
    </View>
  );

  // En navegadores de escritorio (PC/Mac), envolver en un marco de smartphone interactivo
  if (isLargeScreen) {
    return (
      <View style={styles.webDesktopBackground}>
        <View style={styles.webPhoneFrame}>
          <View style={styles.webPhoneSpeakerNotch} />
          <View style={styles.webPhoneScreen}>{appContent}</View>
        </View>
        <Text style={styles.webDeviceBadge}>📱 MedSys Mobile • Demostración Interactiva</Text>
      </View>
    );
  }

  return appContent;
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
  webDesktopBackground: {
    flex: 1,
    backgroundColor: '#090D16',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  webPhoneFrame: {
    width: 390,
    height: 780,
    backgroundColor: '#0F172A',
    borderRadius: 48,
    borderWidth: 6,
    borderColor: '#1E293B',
    overflow: 'hidden',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 20,
  },
  webPhoneSpeakerNotch: {
    width: 100,
    height: 18,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
    zIndex: 99,
  },
  webPhoneScreen: {
    flex: 1,
    overflow: 'hidden',
  },
  webDeviceBadge: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
