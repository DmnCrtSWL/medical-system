import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  User,
  Building2,
  Calendar,
  ChevronRight,
  Plus,
  Stethoscope,
  X,
  Hash,
  Clock,
} from 'lucide-react-native';
import { patientsService } from '../services/patients';
import { PatientSummary } from '../types';
import { useTheme } from '../context/ThemeContext';

interface PatientsListScreenProps {
  onBack: () => void;
  onSelectPatient: (patient: PatientSummary) => void;
  onNewConsultation: () => void;
}

export const PatientsListScreen: React.FC<PatientsListScreenProps> = ({
  onBack,
  onSelectPatient,
  onNewConsultation,
}) => {
  const { colors, isDark } = useTheme();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPatients = useCallback(async (searchQuery?: string) => {
    try {
      const data = await patientsService.getPatients(searchQuery);
      setPatients(data);
    } catch (error) {
      console.warn('Error al cargar directorio de pacientes:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPatients(searchTerm);
  }, [loadPatients, searchTerm]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPatients(searchTerm);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Sin fecha';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.headerBackground}
      />

      {/* Header Quirúrgico */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.headerBackground,
            borderBottomColor: colors.headerBorder,
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Regresar"
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Historial de Pacientes
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {patients.length === 1
                ? '1 paciente registrado'
                : `${patients.length} pacientes registrados`}
            </Text>
          </View>
        </View>

        {/* Buscador Minimalista */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <Search size={18} color={colors.inputPlaceholder} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.inputText }]}
            placeholder="Buscar por nombre, diagnóstico o nómina..."
            placeholderTextColor={colors.inputPlaceholder}
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCorrect={false}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearSearchButton}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contenido Principal */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Cargando historial clínico...
          </Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <View
                style={[
                  styles.emptyStateIconContainer,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <User size={36} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
                {searchTerm ? 'No se encontraron pacientes' : 'Directorio vacío'}
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {searchTerm
                  ? `No hay registros que coincidan con "${searchTerm}".`
                  : 'Aún no has registrado consultas médicas en este dispositivo.'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.emptyStateButton,
                  {
                    backgroundColor: colors.primaryLight,
                    borderColor: colors.primaryBorder,
                  },
                ]}
                onPress={onNewConsultation}
                activeOpacity={0.8}
              >
                <Plus size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.emptyStateButtonText, { color: colors.primary }]}>
                  Iniciar Primera Consulta
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.patientCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  shadowColor: colors.shadowColor,
                },
              ]}
              onPress={() => onSelectPatient(item)}
              activeOpacity={0.8}
            >
              <View style={styles.patientCardTopRow}>
                <View
                  style={[
                    styles.avatarBadge,
                    {
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primaryBorder,
                    },
                  ]}
                >
                  <User size={20} color={colors.primary} />
                </View>

                <View style={styles.patientMainInfo}>
                  <View style={styles.patientNameRow}>
                    <Text style={[styles.patientName, { color: colors.textPrimary }]}>
                      {item.name}
                    </Text>
                    {item.isOfflineOnly && (
                      <View
                        style={[
                          styles.offlineTag,
                          {
                            backgroundColor: colors.warningBg,
                            borderColor: colors.warningBorder,
                          },
                        ]}
                      >
                        <Clock size={10} color={colors.warningText} style={{ marginRight: 3 }} />
                        <Text style={[styles.offlineTagText, { color: colors.warningText }]}>
                          Local
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.companyRow}>
                    <Building2 size={13} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text
                      style={[styles.companyText, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {item.companyName}
                    </Text>
                    {item.employeeNumber && (
                      <View
                        style={[
                          styles.employeeTag,
                          {
                            backgroundColor: colors.surfaceSecondary,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Hash size={11} color={colors.textMuted} style={{ marginRight: 2 }} />
                        <Text style={[styles.employeeTagText, { color: colors.textSecondary }]}>
                          {item.employeeNumber}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <ChevronRight size={20} color={colors.textMuted} />
              </View>

              {/* Diagnosis Summary Row */}
              <View
                style={[
                  styles.diagnosisBox,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Stethoscope size={14} color={colors.primary} style={styles.diagnosisIcon} />
                <Text
                  style={[styles.diagnosisText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  <Text style={{ fontWeight: '700', color: colors.textPrimary }}>Último Dx: </Text>
                  {item.lastDiagnosis || 'Consulta médica general'}
                </Text>
              </View>

              {/* Footer Row */}
              <View style={styles.patientCardFooter}>
                <View style={styles.dateRow}>
                  <Calendar size={13} color={colors.textMuted} style={{ marginRight: 4 }} />
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    {formatDate(item.lastConsultationDate)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.visitsCountBadge,
                    {
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primaryBorder,
                    },
                  ]}
                >
                  <Text style={[styles.visitsCountText, { color: colors.primary }]}>
                    {item.consultationsCount === 1
                      ? '1 Consulta'
                      : `${item.consultationsCount} Consultas`}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Botón Flotante Circular (FAB) "+" */}
      <TouchableOpacity
        style={[
          styles.fabButton,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
        onPress={onNewConsultation}
        activeOpacity={0.85}
        accessibilityLabel="Iniciar Nueva Consulta"
      >
        <Plus size={28} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  clearSearchButton: {
    padding: 6,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyStateButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  patientCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  patientCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  patientMainInfo: {
    flex: 1,
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    marginRight: 6,
  },
  offlineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  offlineTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyText: {
    fontSize: 12,
    flexShrink: 1,
  },
  employeeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 1,
  },
  employeeTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  diagnosisBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  diagnosisIcon: {
    marginRight: 6,
  },
  diagnosisText: {
    fontSize: 12,
    flex: 1,
  },
  patientCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
  },
  visitsCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  visitsCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 99,
  },
});
