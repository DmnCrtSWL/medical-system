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
  Sun,
  Moon,
} from 'lucide-react-native';
import { consultationsService } from '../services/consultations';
import { syncEngine } from '../services/syncEngine';
import { authService } from '../services/auth';
import { ClinicalConsultation, DoctorUser } from '../types';
import { useTheme } from '../context/ThemeContext';

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
  const { isDark, colors, toggleTheme } = useTheme();

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.headerBackground}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.logoRow}>
              <View
                style={[
                  styles.logoBadge,
                  {
                    backgroundColor: colors.primaryLight,
                    borderColor: colors.primaryBorder,
                  },
                ]}
              >
                <Stethoscope size={28} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>MedSys Mobile</Text>
              </View>
            </View>

            {/* Actions: Theme Switcher & Logout */}
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[
                  styles.headerIconButton,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                  },
                ]}
                onPress={toggleTheme}
                activeOpacity={0.7}
                accessibilityLabel="Cambiar tema"
              >
                {isDark ? (
                  <Sun size={18} color="#FBBF24" />
                ) : (
                  <Moon size={18} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.headerIconButton,
                  {
                    backgroundColor: colors.dangerBg,
                    borderColor: colors.dangerBorder,
                  },
                ]}
                onPress={handleLogoutPress}
                activeOpacity={0.7}
                accessibilityLabel="Cerrar sesión"
              >
                <LogOut size={18} color={colors.dangerText} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dynamic Connection Badge */}
          <TouchableOpacity
            style={[
              styles.statusBadge,
              isOnline
                ? {
                    backgroundColor: colors.statusOnlineBg,
                    borderColor: colors.statusOnlineBorder,
                  }
                : {
                    backgroundColor: colors.statusOfflineBg,
                    borderColor: colors.statusOfflineBorder,
                  },
            ]}
            onPress={checkConnectivity}
            activeOpacity={0.7}
          >
            {isOnline ? (
              <>
                <Wifi size={14} color={colors.statusOnlineText} style={{ marginRight: 6 }} />
                <Text style={[styles.statusText, { color: colors.statusOnlineText }]}>
                  Online
                </Text>
              </>
            ) : (
              <>
                <WifiOff size={14} color={colors.statusOfflineText} style={{ marginRight: 6 }} />
                <Text style={[styles.statusText, { color: colors.statusOfflineText }]}>
                  Offline
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Doctor Info Card */}
        <View
          style={[
            styles.doctorCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadowColor,
            },
          ]}
        >
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor: colors.infoBg,
                borderColor: colors.infoBorder,
              },
            ]}
          >
            <UserCheck size={28} color={colors.infoText} />
          </View>
          <View style={styles.doctorInfo}>
            <Text style={[styles.doctorName, { color: colors.textPrimary }]}>
              {user?.name || 'Dr. Médico In-House'}
            </Text>
            <Text style={[styles.doctorEmail, { color: colors.textSecondary }]}>
              {user?.email || 'medico@medical.com'}
            </Text>
            <View style={styles.doctorBadgeRow}>
              <Building2 size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.doctorBadgeText, { color: colors.primary }]}>
                {doctorCompany ? `Médico In-House en ${doctorCompany}` : 'Médico General de Planta'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section Title */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Acciones Rápidas</Text>

        {/* Acción 1: Nueva Consulta */}
        <TouchableOpacity
          style={[
            styles.actionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadowColor,
            },
          ]}
          onPress={onNavigateToNewConsultation}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.actionIconContainer,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primaryBorder,
              },
            ]}
          >
            <FileSpreadsheet size={24} color={colors.primary} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
              Nueva Historia Clínica
            </Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
              Captura datos de consulta en modo local/offline
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Acción 2: Historial de Pacientes */}
        <TouchableOpacity
          style={[
            styles.actionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadowColor,
            },
          ]}
          onPress={onNavigateToPatients}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.actionIconContainer,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primaryBorder,
              },
            ]}
          >
            <Users size={24} color={colors.primary} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
              Historial de Pacientes
            </Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
              Consulta expedientes clínicos e historial de visitas
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Acción 3: Cola de Sincronización */}
        <TouchableOpacity
          style={[
            styles.actionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadowColor,
            },
          ]}
          onPress={openQueueModal}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.actionIconContainer,
              {
                backgroundColor: colors.infoBg,
                borderColor: colors.infoBorder,
              },
            ]}
          >
            <RefreshCw size={24} color={colors.infoText} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
              Cola de Sincronización
            </Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
              {pendingCount === 0
                ? 'Todos los expedientes sincronizados'
                : pendingCount === 1
                ? '1 expediente pendiente por subir'
                : `${pendingCount} expedientes pendientes por subir`}
            </Text>
          </View>
          {pendingCount > 0 ? (
            <View
              style={[
                styles.countBadgePending,
                {
                  backgroundColor: colors.warningBg,
                  borderColor: colors.warningBorder,
                },
              ]}
            >
              <Text style={[styles.countBadgeTextPending, { color: colors.warningText }]}>
                {pendingCount}
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.countBadgeSynced,
                {
                  backgroundColor: colors.statusOnlineBg,
                  borderColor: colors.statusOnlineBorder,
                },
              ]}
            >
              <Check size={12} color={colors.statusOnlineText} />
            </View>
          )}
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            MedSys Native Engine v1.0.0
          </Text>
          <Text style={[styles.footerSubtext, { color: colors.textMuted }]}>
            Motor Inteligente de Sincronización B2B
          </Text>
        </View>
      </ScrollView>

      {/* Modal de Inspección y Sincronización */}
      <Modal
        visible={isQueueModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsQueueModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.modalContainer,
                borderColor: colors.modalBorder,
              },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Cola de Sincronización
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {consultations.length} expedientes guardados en este dispositivo
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => setIsQueueModalVisible(false)}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Banner de Acción si hay pendientes */}
            {pendingCount > 0 && (
              <View
                style={[
                  styles.modalSyncBanner,
                  {
                    backgroundColor: colors.warningBg,
                    borderColor: colors.warningBorder,
                  },
                ]}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={[styles.modalSyncTitle, { color: colors.warningText }]}>
                    {pendingCount} por subir al servidor
                  </Text>
                  <Text style={[styles.modalSyncSubtitle, { color: colors.textSecondary }]}>
                    Sincroniza para reflejarlos en el Admin
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.modalSyncButton, { backgroundColor: colors.warningText }]}
                  onPress={handleSyncNow}
                  disabled={isSyncing}
                  activeOpacity={0.8}
                >
                  {isSyncing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Cloud size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.modalSyncButtonText}>Subir Todo</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {syncFeedback && (
              <View
                style={[
                  styles.feedbackBanner,
                  {
                    backgroundColor: colors.statusOnlineBg,
                    borderColor: colors.statusOnlineBorder,
                  },
                ]}
              >
                <CheckCircle2 size={16} color={colors.statusOnlineText} style={{ marginRight: 6 }} />
                <Text style={[styles.feedbackText, { color: colors.statusOnlineText }]}>
                  {syncFeedback}
                </Text>
              </View>
            )}

            {consultations.length === 0 ? (
              <View style={styles.emptyState}>
                <CheckCircle2 size={48} color={colors.primary} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Todo al día</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
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
                    <View
                      style={[
                        styles.queueItemCard,
                        {
                          backgroundColor: colors.surfaceSecondary,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.queueItemHeader}>
                        <Text style={[styles.queuePatientName, { color: colors.textPrimary }]}>
                          {item.patientName}
                        </Text>
                        {isSynced ? (
                          <View
                            style={[
                              styles.syncedBadge,
                              {
                                backgroundColor: colors.statusOnlineBg,
                              },
                            ]}
                          >
                            <CheckCircle2
                              size={12}
                              color={colors.statusOnlineText}
                              style={{ marginRight: 4 }}
                            />
                            <Text
                              style={[
                                styles.syncedBadgeText,
                                { color: colors.statusOnlineText },
                              ]}
                            >
                              Sincronizado
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.pendingBadge,
                              {
                                backgroundColor: colors.warningBg,
                              },
                            ]}
                          >
                            <Clock size={12} color={colors.warningText} style={{ marginRight: 4 }} />
                            <Text
                              style={[
                                styles.pendingBadgeText,
                                { color: colors.warningText },
                              ]}
                            >
                              Pendiente
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={[styles.queueDiagnosis, { color: colors.textSecondary }]}>
                        <Text style={{ fontWeight: '700', color: colors.textMuted }}>Dx: </Text>
                        {item.diagnosisDescription}
                      </Text>

                      <View style={styles.queueMetaRow}>
                        <Text style={[styles.queueMetaText, { color: colors.textMuted }]}>
                          {item.companyName || 'Empresa Asignada'} •{' '}
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>

                        <View style={styles.itemActionButtons}>
                          {!isSynced && (
                            <TouchableOpacity
                              style={[
                                styles.syncSingleButton,
                                {
                                  backgroundColor: colors.warningBg,
                                  borderColor: colors.warningBorder,
                                },
                              ]}
                              onPress={() => handleSyncSingle(item.localId, item.patientName)}
                              disabled={syncingItemId === item.localId || isSyncing}
                              activeOpacity={0.8}
                            >
                              {syncingItemId === item.localId ? (
                                <ActivityIndicator size="small" color={colors.warningText} />
                              ) : (
                                <>
                                  <Cloud
                                    size={13}
                                    color={colors.warningText}
                                    style={{ marginRight: 4 }}
                                  />
                                  <Text
                                    style={[
                                      styles.syncSingleButtonText,
                                      { color: colors.warningText },
                                    ]}
                                  >
                                    Subir
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            style={[
                              styles.deleteItemButton,
                              {
                                backgroundColor: colors.dangerBg,
                                borderColor: colors.dangerBorder,
                              },
                            ]}
                            onPress={() =>
                              handleDeleteConsultation(item.localId, item.patientName)
                            }
                            activeOpacity={0.7}
                          >
                            <Trash2 size={14} color={colors.dangerText} />
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
    paddingBottom: 40,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  doctorEmail: {
    fontSize: 13,
    marginBottom: 6,
  },
  doctorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  actionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  countBadgePending: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
  },
  countBadgeTextPending: {
    fontSize: 12,
    fontWeight: '800',
  },
  countBadgeSynced: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 420,
    paddingBottom: 40,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSyncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  modalSyncTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalSyncSubtitle: {
    fontSize: 12,
  },
  modalSyncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  modalSyncButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  queueItemCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
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
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  syncedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  queueDiagnosis: {
    fontSize: 13,
    marginBottom: 8,
  },
  queueMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  queueMetaText: {
    fontSize: 11,
  },
  itemActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncSingleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  syncSingleButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteItemButton: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});
