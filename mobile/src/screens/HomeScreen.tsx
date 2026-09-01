import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {
  Stethoscope,
  Wifi,
  WifiOff,
  FileSpreadsheet,
  RefreshCw,
  UserCheck,
  Building2,
  ChevronRight,
  LogOut,
  X,
  Trash2,
  Clock,
  CheckCircle2,
  Cloud,
  Check,
  Users,
} from 'lucide-react-native';
import { consultationsService } from '../services/consultations';
import { syncEngine } from '../services/syncEngine';
import { authService } from '../services/auth';
import { ClinicalConsultation, DoctorUser } from '../types';

interface HomeScreenProps {
  user?: DoctorUser | null;
  onLogout: () => void;
  onNavigateToNewConsultation: () => void;
  onNavigateToPatients: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  onLogout,
  onNavigateToNewConsultation,
  onNavigateToPatients,
}) => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [consultations, setConsultations] = useState<ClinicalConsultation[]>([]);
  const [isQueueModalVisible, setIsQueueModalVisible] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncingItemId, setSyncingItemId] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [doctorCompany, setDoctorCompany] = useState<string | null>(null);

  const loadConsultationsData = useCallback(async () => {
    try {
      const list = await consultationsService.getLocalConsultations();
      setConsultations(list);
      const count = list.filter((c) => c.syncStatus === 'PENDING').length;
      setPendingCount(count);
    } catch {
      // Ignorar errores en lectura local
    }
  }, []);

  const checkConnectivity = useCallback(async () => {
    const connected = await syncEngine.checkServerConnection();
    setIsOnline(connected);
    return connected;
  }, []);

  useEffect(() => {
    loadConsultationsData();
    checkConnectivity();

    // Cargar empresa asignada al médico desde el backend
    authService.getDoctorAssignedCompany().then((company) => {
      if (company) {
        setDoctorCompany(company);
      }
    });

    // Comprobar estado de conexión periódicamente cada 15 segundos
    const interval = setInterval(() => {
      checkConnectivity();
    }, 15000);

    return () => clearInterval(interval);
  }, [loadConsultationsData, checkConnectivity]);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);

    const isConnected = await checkConnectivity();
    if (!isConnected) {
      setIsSyncing(false);
      const msg = 'Sin conexión con el servidor. Verifica que el backend esté activo.';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Servidor no disponible', msg);
      }
      return;
    }

    try {
      const result = await syncEngine.syncPendingConsultations();
      await loadConsultationsData();

      setSyncFeedback(result.message);

      if (Platform.OS === 'web') {
        alert(result.message);
      } else {
        Alert.alert(
          result.success ? 'Sincronización Exitosa' : 'Aviso de Sincronización',
          result.message
        );
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Error al sincronizar';
      if (Platform.OS === 'web') {
        alert(errMessage);
      } else {
        Alert.alert('Error', errMessage);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncSingle = async (localId: string, patientName: string) => {
    setSyncingItemId(localId);
    try {
      const isConnected = await checkConnectivity();
      if (!isConnected) {
        const msg = 'Sin conexión con el servidor. Verifica que el backend esté activo.';
        if (Platform.OS === 'web') {
          alert(msg);
        } else {
          Alert.alert('Servidor no disponible', msg);
        }
        return;
      }

      const result = await syncEngine.syncSingleConsultation(localId);
      await loadConsultationsData();

      if (Platform.OS === 'web') {
        alert(result.message);
      } else {
        Alert.alert(
          result.success ? 'Expediente Sincronizado' : 'Aviso de Sincronización',
          result.message
        );
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Error al sincronizar';
      if (Platform.OS === 'web') {
        alert(errMessage);
      } else {
        Alert.alert('Error', errMessage);
      }
    } finally {
      setSyncingItemId(null);
    }
  };

  const handleLogoutPress = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        onLogout();
      }
    } else {
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro de que deseas salir del consultorio?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: onLogout },
        ]
      );
    }
  };

  const handleDeleteConsultation = async (localId: string, patientName: string) => {
    const confirmDelete = async () => {
      await consultationsService.deleteLocalConsultation(localId);
      await loadConsultationsData();
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`¿Eliminar la consulta local de ${patientName}?`)) {
        await confirmDelete();
      }
    } else {
      Alert.alert(
        'Eliminar Registro Local',
        `¿Deseas eliminar del dispositivo el registro de ${patientName}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const openQueueModal = async () => {
    await loadConsultationsData();
    await checkConnectivity();
    setIsQueueModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.logoRow}>
              <View style={styles.logoBadge}>
                <Stethoscope size={28} color="#34D399" />
              </View>
              <View>
                <Text style={styles.brandTitle}>MedSys Mobile</Text>
              </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogoutPress}
              activeOpacity={0.7}
              accessibilityLabel="Cerrar sesión"
            >
              <LogOut size={20} color="#F87171" />
            </TouchableOpacity>
          </View>

          {/* Dynamic Connection Badge */}
          <TouchableOpacity
            style={isOnline ? styles.statusBadgeOnline : styles.statusBadgeOffline}
            onPress={checkConnectivity}
            activeOpacity={0.7}
          >
            {isOnline ? (
              <>
                <Wifi size={14} color="#34D399" />
                <Text style={styles.statusTextOnline}>Online</Text>
              </>
            ) : (
              <>
                <WifiOff size={14} color="#FBBF24" />
                <Text style={styles.statusTextOffline}>Offline</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Doctor Card Profile */}
        <View style={styles.doctorCard}>
          <View style={styles.doctorAvatar}>
            <UserCheck size={26} color="#FFFFFF" />
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{user?.name || 'Dr. Carlos Mendoza'}</Text>
            <Text style={styles.doctorEmail}>
              {user?.email || 'carlos.mendoza@medical.com'}
            </Text>
            <View style={styles.companyChip}>
              <Building2 size={12} color="#34D399" />
              <Text style={styles.companyText}>
                {doctorCompany ? `Médico In-House en ${doctorCompany}` : 'Médico Certificado In-House'}
              </Text>
            </View>
          </View>
        </View>

        {/* Banner de Sincronización Rápida si hay pendientes */}
        {pendingCount > 0 && (
          <View style={styles.syncAlertCard}>
            <View style={styles.syncAlertInfo}>
              <Cloud size={20} color="#FBBF24" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.syncAlertTitle}>
                  {pendingCount === 1 ? '1 expediente listo' : `${pendingCount} expedientes listos`}
                </Text>
                <Text style={styles.syncAlertSubtitle}>Pendientes de subir a la nube B2B</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.syncNowButton, isSyncing && styles.syncNowButtonDisabled]}
              onPress={handleSyncNow}
              disabled={isSyncing}
              activeOpacity={0.8}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <>
                  <RefreshCw size={14} color="#0F172A" style={{ marginRight: 6 }} />
                  <Text style={styles.syncNowButtonText}>Subir Ahora</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Acciones Rápidas */}
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

        {/* Acción 1: Nueva Historia Clínica */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={onNavigateToNewConsultation}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
            <FileSpreadsheet size={24} color="#34D399" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Nueva Historia Clínica</Text>
            <Text style={styles.actionDescription}>Captura datos de consulta en modo local/offline</Text>
          </View>
          <ChevronRight size={20} color="#64748B" />
        </TouchableOpacity>

        {/* Acción 2: Historial de Pacientes */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={onNavigateToPatients}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
            <Users size={24} color="#34D399" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Historial de Pacientes</Text>
            <Text style={styles.actionDescription}>Consulta expedientes clínicos e historial de visitas</Text>
          </View>
          <ChevronRight size={20} color="#64748B" />
        </TouchableOpacity>

        {/* Acción 3: Cola de Sincronización */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={openQueueModal}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <RefreshCw size={24} color="#60A5FA" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Cola de Sincronización</Text>
            <Text style={styles.actionDescription}>
              {pendingCount === 0
                ? 'Todos los expedientes sincronizados'
                : pendingCount === 1
                ? '1 expediente pendiente por subir'
                : `${pendingCount} expedientes pendientes por subir`}
            </Text>
          </View>
          {pendingCount > 0 ? (
            <View style={styles.countBadgePending}>
              <Text style={styles.countBadgeTextPending}>{pendingCount}</Text>
            </View>
          ) : (
            <View style={styles.countBadgeSynced}>
              <Check size={12} color="#34D399" />
            </View>
          )}
          <ChevronRight size={20} color="#64748B" />
        </TouchableOpacity>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>MedSys Native Engine v1.0.0</Text>
          <Text style={styles.footerSubtext}>Motor Inteligente de Sincronización B2B</Text>
        </View>
      </ScrollView>

      {/* Modal de Inspección y Sincronización */}
      <Modal
        visible={isQueueModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsQueueModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Cola de Sincronización</Text>
                <Text style={styles.modalSubtitle}>
                  {consultations.length} expedientes guardados en este dispositivo
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsQueueModalVisible(false)}
              >
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {consultations.length === 0 ? (
              <View style={styles.emptyState}>
                <CheckCircle2 size={48} color="#34D399" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>Todo al día</Text>
                <Text style={styles.emptyText}>
                  No hay historias clínicas registradas localmente en este dispositivo.
                </Text>
              </View>
            ) : (
              <FlatList
                data={consultations}
                keyExtractor={(item) => item.localId}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => {
                  const isSynced = item.syncStatus === 'SYNCED';

                  return (
                    <View style={styles.queueItemCard}>
                      <View style={styles.queueItemHeader}>
                        <Text style={styles.queuePatientName}>{item.patientName}</Text>
                        {isSynced ? (
                          <View style={styles.syncedBadge}>
                            <CheckCircle2 size={12} color="#34D399" style={{ marginRight: 4 }} />
                            <Text style={styles.syncedBadgeText}>Sincronizado</Text>
                          </View>
                        ) : (
                          <View style={styles.pendingBadge}>
                            <Clock size={12} color="#FBBF24" style={{ marginRight: 4 }} />
                            <Text style={styles.pendingBadgeText}>Pendiente</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.queueDiagnosis}>
                        <Text style={{ fontWeight: '700', color: '#94A3B8' }}>Dx: </Text>
                        {item.diagnosisDescription}
                      </Text>

                      <View style={styles.queueMetaRow}>
                        <Text style={styles.queueMetaText}>
                          {item.companyName || 'TechCorp Mexico'} •{' '}
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>

                        <View style={styles.itemActionButtons}>
                          {!isSynced && (
                            <TouchableOpacity
                              style={styles.syncSingleButton}
                              onPress={() => handleSyncSingle(item.localId, item.patientName)}
                              disabled={syncingItemId === item.localId || isSyncing}
                              activeOpacity={0.8}
                            >
                              {syncingItemId === item.localId ? (
                                <ActivityIndicator size="small" color="#0F172A" />
                              ) : (
                                <>
                                  <RefreshCw size={11} color="#0F172A" style={{ marginRight: 4 }} />
                                  <Text style={styles.syncSingleButtonText}>Sincronizar</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            style={styles.deleteItemButton}
                            onPress={() => handleDeleteConsultation(item.localId, item.patientName)}
                            accessibilityLabel="Eliminar registro"
                          >
                            <Trash2 size={16} color="#F87171" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 64 : 24,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoutButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadgeOnline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  statusTextOnline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34D399',
    marginLeft: 6,
  },
  statusBadgeOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  statusTextOffline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FBBF24',
    marginLeft: 6,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doctorEmail: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  companyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  companyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34D399',
    marginLeft: 4,
  },
  syncAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  syncAlertInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  syncAlertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF24',
  },
  syncAlertSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  syncNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF24',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  syncNowButtonDisabled: {
    opacity: 0.6,
  },
  syncNowButtonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 14,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionDescription: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  countBadgePending: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  countBadgeTextPending: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  countBadgeSynced: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 420,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSyncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  modalSyncTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF24',
  },
  modalSyncSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modalSyncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF24',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  queueItemCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  queueItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  queuePatientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24',
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  syncedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  queueDiagnosis: {
    fontSize: 13,
    color: '#E2E8F0',
    marginBottom: 8,
  },
  queueMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  deleteItemButton: {
    padding: 6,
  },
  itemActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncSingleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF24',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  syncSingleButtonText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
});
