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
} from 'react-native';
import {
  Stethoscope,
  Wifi,
  FileSpreadsheet,
  RefreshCw,
  UserCheck,
  Building2,
  ChevronRight,
  LogOut,
  X,
  Trash2,
  Clock,
  CheckCircle,
} from 'lucide-react-native';
import { consultationsService } from '../services/consultations';
import { ClinicalConsultation, DoctorUser } from '../types';

interface HomeScreenProps {
  user?: DoctorUser | null;
  onLogout: () => void;
  onNavigateToNewConsultation: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  onLogout,
  onNavigateToNewConsultation,
}) => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [consultations, setConsultations] = useState<ClinicalConsultation[]>([]);
  const [isQueueModalVisible, setIsQueueModalVisible] = useState<boolean>(false);

  const loadConsultationsData = useCallback(async () => {
    try {
      const list = await consultationsService.getLocalConsultations();
      setConsultations(list);
      const count = list.filter((c) => c.syncStatus === 'PENDING').length;
      setPendingCount(count);
    } catch {
      // Ignorar errores en carga de datos locales
    }
  }, []);

  useEffect(() => {
    loadConsultationsData();
  }, [loadConsultationsData]);

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
        'Eliminar Consulta Local',
        `¿Estás seguro de eliminar el registro de ${patientName}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const openQueueModal = async () => {
    await loadConsultationsData();
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
                <Text style={styles.brandSubtitle}>App de Consultorio para Médicos</Text>
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

          {/* Connection Badge */}
          <View style={styles.statusBadge}>
            <Wifi size={14} color="#34D399" />
            <Text style={styles.statusText}>Modo En Línea (Listo)</Text>
          </View>
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
                {user?.role === 'DOCTOR' ? 'Médico Certificado In-House' : 'Médico General & Salud Ocupacional'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
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

        {/* Acción 2: Cola de Sincronización */}
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
              {pendingCount === 1
                ? '1 expediente pendiente por subir al servidor'
                : `${pendingCount} expedientes pendientes por subir al servidor`}
            </Text>
          </View>
          {pendingCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{pendingCount}</Text>
            </View>
          )}
          <ChevronRight size={20} color="#64748B" />
        </TouchableOpacity>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>MedSys Native Engine v1.0.0</Text>
          <Text style={styles.footerSubtext}>Motor de Almacenamiento Clínico Offline</Text>
        </View>
      </ScrollView>

      {/* Modal de Cola de Sincronización */}
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
                  {consultations.length} consultas registradas localmente
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
                <CheckCircle size={48} color="#34D399" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>Todo al día</Text>
                <Text style={styles.emptyText}>
                  No hay historias clínicas pendientes de sincronizar en este dispositivo.
                </Text>
              </View>
            ) : (
              <FlatList
                data={consultations}
                keyExtractor={(item) => item.localId}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                  <View style={styles.queueItemCard}>
                    <View style={styles.queueItemHeader}>
                      <Text style={styles.queuePatientName}>{item.patientName}</Text>
                      <View style={styles.pendingBadge}>
                        <Clock size={12} color="#FBBF24" style={{ marginRight: 4 }} />
                        <Text style={styles.pendingBadgeText}>Pendiente</Text>
                      </View>
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
                      <TouchableOpacity
                        style={styles.deleteItemButton}
                        onPress={() => handleDeleteConsultation(item.localId, item.patientName)}
                      >
                        <Trash2 size={16} color="#F87171" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
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
    marginBottom: 24,
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
  statusBadge: {
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
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34D399',
    marginLeft: 6,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 20,
    marginBottom: 28,
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
  countBadge: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  countBadgeText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
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
  },
  modalContainer: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
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
});
