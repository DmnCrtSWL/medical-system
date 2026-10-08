import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import {
  ArrowLeft,
  User,
  Building2,
  Calendar,
  Stethoscope,
  Heart,
  Activity,
  Thermometer,
  Scale,
  Pill,
  FileText,
  ChevronDown,
  ChevronUp,
  Plus,
  Hash,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react-native';
import { patientsService } from '../services/patients';
import { PatientHistoryResponse, PatientHistoryItem } from '../types';
import { useTheme } from '../context/ThemeContext';

interface PatientHistoryScreenProps {
  patientId: string;
  patientName?: string;
  onBack: () => void;
  onNewConsultationForPatient: (patientInfo: {
    name: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    employeeNumber?: string;
    age?: number;
    gender?: 'MASCULINO' | 'FEMENINO' | 'OTRO';
    allergies?: string;
  }) => void;
}

export const PatientHistoryScreen: React.FC<PatientHistoryScreenProps> = ({
  patientId,
  patientName,
  onBack,
  onNewConsultationForPatient,
}) => {
  const { colors, isDark } = useTheme();
  const [historyData, setHistoryData] = useState<PatientHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const loadHistory = useCallback(async () => {
    try {
      const data = await patientsService.getPatientHistory(patientId, patientName);
      setHistoryData(data);
      if (data.consultations.length > 0) {
        setExpandedIds(new Set([data.consultations[0].id]));
      }
    } catch (error) {
      console.warn('Error al cargar expediente del paciente:', error);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, patientName]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getBmiCategoryInfo = (bmi?: number) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: 'Bajo peso', color: '#3B82F6' };
    if (bmi < 25) return { label: 'Normal', color: colors.primary };
    if (bmi < 30) return { label: 'Sobrepeso', color: '#D97706' };
    return { label: 'Obesidad', color: '#DC2626' };
  };

  const handleStartConsultation = () => {
    if (!historyData) return;

    // Calcular edad a partir de fecha de nacimiento o tomarla de la consulta previa más reciente
    let calculatedAge: number | undefined;
    if (historyData.patient.dateOfBirth) {
      const birth = new Date(historyData.patient.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age > 0 && age < 130) {
        calculatedAge = age;
      }
    }
    if (!calculatedAge) {
      const lastWithAge = historyData.consultations.find(
        (c) => c.patientAge != null && c.patientAge > 0
      );
      if (lastWithAge?.patientAge) {
        calculatedAge = lastWithAge.patientAge;
      }
    }

    // Tomar alergias conocidas de la consulta previa más reciente si existen
    const lastWithAllergies = historyData.consultations.find(
      (c) => c.allergies && c.allergies.trim().length > 0
    );
    const knownAllergies = lastWithAllergies?.allergies || undefined;

    // Tomar género del paciente o de la consulta previa
    const patientGender =
      (historyData.patient.gender as 'MASCULINO' | 'FEMENINO' | 'OTRO') ||
      (historyData.consultations.find((c) => c.gender)?.gender as 'MASCULINO' | 'FEMENINO' | 'OTRO') ||
      undefined;

    onNewConsultationForPatient({
      name: historyData.patient.name,
      firstName: historyData.patient.firstName,
      lastName: historyData.patient.lastName,
      companyName: historyData.patient.companyName,
      employeeNumber: historyData.patient.employeeNumber || undefined,
      gender: patientGender,
      age: calculatedAge,
      allergies: knownAllergies,
    });
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
          accessibilityLabel="Regresar al directorio"
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Expediente Clínico
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {patientName || historyData?.patient.name || 'Detalle del Paciente'}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Cargando historial clínico...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Tarjeta de Información General del Paciente */}
          {historyData && (
            <View
              style={[
                styles.patientProfileCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  shadowColor: colors.shadowColor,
                },
              ]}
            >
              <View style={styles.profileHeaderRow}>
                <View
                  style={[
                    styles.avatarBadge,
                    {
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primaryBorder,
                    },
                  ]}
                >
                  <User size={28} color={colors.primary} />
                </View>
                <View style={styles.profileMainInfo}>
                  <Text style={[styles.patientName, { color: colors.textPrimary }]}>
                    {historyData.patient.name}
                  </Text>
                  <View style={styles.companyBadgeRow}>
                    <Building2 size={13} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={[styles.companyNameText, { color: colors.textSecondary }]}>
                      {historyData.patient.companyName}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Grid de Metadatos del Paciente */}
              <View
                style={[
                  styles.patientMetaGrid,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                {historyData.patient.employeeNumber && (
                  <View style={styles.metaItem}>
                    <Hash size={13} color={colors.textMuted} style={{ marginRight: 4 }} />
                    <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Nómina: </Text>
                    <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                      {historyData.patient.employeeNumber}
                    </Text>
                  </View>
                )}

                <View style={styles.metaItem}>
                  <FileText size={13} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Consultas: </Text>
                  <Text style={[styles.metaValue, { color: colors.primary }]}>
                    {historyData.patient.totalConsultations}
                  </Text>
                </View>

                {historyData.patient.phone && (
                  <View style={styles.metaItem}>
                    <Phone size={13} color={colors.textMuted} style={{ marginRight: 4 }} />
                    <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                      {historyData.patient.phone}
                    </Text>
                  </View>
                )}

                {historyData.patient.email && (
                  <View style={styles.metaItem}>
                    <Mail size={13} color={colors.textMuted} style={{ marginRight: 4 }} />
                    <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                      {historyData.patient.email}
                    </Text>
                  </View>
                )}
              </View>

              {/* Botón de Iniciar Nueva Consulta Directa */}
              <TouchableOpacity
                style={[
                  styles.startConsultationButton,
                  {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                  },
                ]}
                onPress={handleStartConsultation}
                activeOpacity={0.8}
              >
                <Plus size={18} color={colors.textInverse} style={{ marginRight: 8 }} />
                <Text
                  style={[styles.startConsultationButtonText, { color: colors.textInverse }]}
                >
                  Iniciar Nueva Consulta para este Paciente
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sección de Historial de Visitas */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Historial de Consultas Médicas
            </Text>
            <View
              style={[
                styles.totalBadge,
                {
                  backgroundColor: colors.primaryLight,
                  borderColor: colors.primaryBorder,
                },
              ]}
            >
              <Text style={[styles.totalBadgeText, { color: colors.primary }]}>
                {historyData?.consultations.length || 0} Registros
              </Text>
            </View>
          </View>

          {/* Lista de Consultas */}
          {historyData?.consultations.length === 0 ? (
            <View style={styles.emptyConsultationsBox}>
              <View
                style={[
                  styles.emptyConsultationsBadge,
                  {
                    backgroundColor: colors.primaryLight,
                    borderColor: colors.primaryBorder,
                  },
                ]}
              >
                <Stethoscope size={36} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                Expediente Nuevo
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Este paciente aún no cuenta con consultas médicas previas en su línea de tiempo.
              </Text>
              <TouchableOpacity
                style={[
                  styles.emptyCtaButton,
                  {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                  },
                ]}
                onPress={handleStartConsultation}
                activeOpacity={0.85}
              >
                <Plus size={16} color={colors.textInverse} style={{ marginRight: 6 }} />
                <Text style={[styles.emptyCtaButtonText, { color: colors.textInverse }]}>
                  Iniciar Primera Consulta
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            historyData?.consultations.map((consultation: PatientHistoryItem, index: number) => {
              const isExpanded = expandedIds.has(consultation.id);
              const bmiInfo = getBmiCategoryInfo(consultation.vitalSigns?.bmi);
              const isLatest = index === 0;

              return (
                <View key={consultation.id || index} style={styles.timelineRow}>
                  {/* Columna Izquierda: Eje Vertical y Nodo Conector */}
                  <View style={styles.timelineSpineColumn}>
                    {/* Nodo circular indicador */}
                    <View
                      style={[
                        styles.timelineNodeCircle,
                        {
                          backgroundColor: isLatest ? colors.primary : colors.card,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.timelineNodeInnerDot,
                          {
                            backgroundColor: isLatest ? colors.textInverse : colors.primary,
                          },
                        ]}
                      />
                    </View>

                    {/* Línea vertical conectora continua hacia la siguiente cita */}
                    {index < historyData.consultations.length - 1 && (
                      <View
                        style={[
                          styles.timelineSpineLine,
                          { backgroundColor: colors.border },
                        ]}
                      />
                    )}
                  </View>

                  {/* Columna Derecha: Tarjeta de la Consulta */}
                  <View
                    style={[
                      styles.consultationCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: isExpanded ? colors.primaryBorder : colors.cardBorder,
                        shadowColor: colors.shadowColor,
                      },
                    ]}
                  >
                    {/* Encabezado de la Consulta */}
                    <TouchableOpacity
                      style={styles.consultationHeader}
                      onPress={() => toggleExpand(consultation.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.consultationHeaderLeft}>
                        <View
                          style={[
                            styles.timelineIcon,
                            {
                              backgroundColor: colors.primaryLight,
                              borderColor: colors.primaryBorder,
                            },
                          ]}
                        >
                          <Calendar size={16} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0, marginRight: 6 }}>
                          <Text style={[styles.consultationDate, { color: colors.textPrimary }]}>
                            {formatDate(consultation.consultationDate)}
                          </Text>
                          <Text style={[styles.doctorNameText, { color: colors.textSecondary }]} numberOfLines={1}>
                            Atendido por: {consultation.doctorName}
                          </Text>
                        </View>
                      </View>

                    <View style={styles.headerRightActions}>
                      {consultation.status === 'LOCAL_PENDING' && (
                        <View
                          style={[
                            styles.offlineBadge,
                            {
                              backgroundColor: colors.warningBg,
                              borderColor: colors.warningBorder,
                            },
                          ]}
                        >
                          <Clock size={11} color={colors.warningText} style={{ marginRight: 3 }} />
                          <Text
                            style={[
                              styles.offlineBadgeText,
                              { color: colors.warningText },
                            ]}
                          >
                            Pendiente
                          </Text>
                        </View>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={20} color={colors.textMuted} />
                      ) : (
                        <ChevronDown size={20} color={colors.textMuted} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Diagnóstico Resumido (Siempre visible) */}
                  <View
                    style={[
                      styles.diagnosisSummaryBox,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Stethoscope size={16} color={colors.primary} style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.diagnosisLabel, { color: colors.textMuted }]}>
                        Diagnóstico / Impresión Clínica:
                      </Text>
                      <Text
                        style={[
                          styles.diagnosisDescriptionText,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {consultation.diagnosisDescription}
                      </Text>
                    </View>
                  </View>

                  {/* Detalle Expandible de la Consulta */}
                  {isExpanded && (
                    <View
                      style={[
                        styles.expandedContent,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      {/* Signos Vitales Históricos */}
                      <Text style={[styles.subSectionTitle, { color: colors.textMuted }]}>
                        Somatometría Registrada:
                      </Text>

                      <View style={styles.vitalsSummaryGrid}>
                        {/* Presión */}
                        <View
                          style={[
                            styles.vitalItem,
                            {
                              backgroundColor: colors.surfaceSecondary,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Heart size={14} color="#EF4444" style={{ marginRight: 4 }} />
                          <Text style={[styles.vitalItemLabel, { color: colors.textMuted }]}>
                            Presión (T/A):
                          </Text>
                          <Text
                            style={[
                              styles.vitalItemValue,
                              { color: colors.textPrimary },
                            ]}
                          >
                            {consultation.vitalSigns?.bloodPressureSystolic &&
                            consultation.vitalSigns?.bloodPressureDiastolic
                              ? `${consultation.vitalSigns.bloodPressureSystolic}/${consultation.vitalSigns.bloodPressureDiastolic} mmHg`
                              : 'N/A'}
                          </Text>
                        </View>

                        {/* Peso en Kg */}
                        <View
                          style={[
                            styles.vitalItem,
                            {
                              backgroundColor: colors.surfaceSecondary,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Scale size={14} color={colors.primary} style={{ marginRight: 4 }} />
                          <Text style={[styles.vitalItemLabel, { color: colors.textMuted }]}>
                            Peso:
                          </Text>
                          <Text
                            style={[
                              styles.vitalItemValue,
                              { color: colors.textPrimary },
                            ]}
                          >
                            {consultation.vitalSigns?.weightKg
                              ? `${consultation.vitalSigns.weightKg} kg`
                              : 'N/A'}
                          </Text>
                        </View>

                        {/* Pulso */}
                        <View
                          style={[
                            styles.vitalItem,
                            {
                              backgroundColor: colors.surfaceSecondary,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Activity size={14} color={colors.primary} style={{ marginRight: 4 }} />
                          <Text style={[styles.vitalItemLabel, { color: colors.textMuted }]}>
                            Pulso:
                          </Text>
                          <Text
                            style={[
                              styles.vitalItemValue,
                              { color: colors.textPrimary },
                            ]}
                          >
                            {consultation.vitalSigns?.heartRate
                              ? `${consultation.vitalSigns.heartRate} lpm`
                              : 'N/A'}
                          </Text>
                        </View>

                        {/* Temperatura */}
                        <View
                          style={[
                            styles.vitalItem,
                            {
                              backgroundColor: colors.surfaceSecondary,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Thermometer size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                          <Text style={[styles.vitalItemLabel, { color: colors.textMuted }]}>
                            Temp:
                          </Text>
                          <Text
                            style={[
                              styles.vitalItemValue,
                              { color: colors.textPrimary },
                            ]}
                          >
                            {consultation.vitalSigns?.temperature
                              ? `${consultation.vitalSigns.temperature} °C`
                              : 'N/A'}
                          </Text>
                        </View>

                        {/* IMC (Ancho completo para balance visual) */}
                        <View
                          style={[
                            styles.vitalItemFull,
                            {
                              backgroundColor: colors.surfaceSecondary,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Scale size={14} color="#8B5CF6" style={{ marginRight: 6 }} />
                            <Text style={[styles.vitalItemLabel, { color: colors.textMuted }]}>
                              Índice de Masa Corporal (IMC):
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text
                              style={[
                                styles.vitalItemValue,
                                { color: bmiInfo ? bmiInfo.color : colors.textPrimary, marginRight: 6 },
                              ]}
                            >
                              {consultation.vitalSigns?.bmi ? consultation.vitalSigns.bmi : 'N/A'}
                            </Text>
                            {bmiInfo && (
                              <View
                                style={[
                                  styles.bmiPillBadge,
                                  {
                                    backgroundColor: colors.card,
                                    borderColor: bmiInfo.color,
                                  },
                                ]}
                              >
                                <Text style={[styles.bmiPillText, { color: bmiInfo.color }]}>
                                  {bmiInfo.label}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Motivo de Consulta, Alergias y Notas Clínicas */}
                      <View style={styles.clinicalNotesSection}>
                        {consultation.allergies && (
                          <View
                            style={[
                              styles.allergyBanner,
                              {
                                backgroundColor: colors.warningBg,
                                borderColor: colors.warningBorder,
                              },
                            ]}
                          >
                            <AlertTriangle size={15} color={colors.warningText} style={{ marginRight: 6 }} />
                            <Text style={[styles.allergyBannerText, { color: colors.warningText }]}>
                              <Text style={{ fontWeight: '700' }}>Alergias: </Text>
                              {consultation.allergies}
                            </Text>
                          </View>
                        )}

                        {consultation.clinicalNotes && (
                          <View
                            style={[
                              styles.clinicalNotesHighlightBox,
                              {
                                backgroundColor: colors.surfaceSecondary,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <Text style={[styles.noteHeading, { color: colors.primary }]}>
                              Notas Clínicas del Médico:
                            </Text>
                            <Text style={[styles.noteBody, { color: colors.textPrimary }]}>
                              {consultation.clinicalNotes}
                            </Text>
                          </View>
                        )}

                        <View style={styles.clinicalNoteBlock}>
                          <Text style={[styles.noteHeading, { color: colors.textMuted }]}>
                            Motivo de Consulta:
                          </Text>
                          <Text style={[styles.noteBody, { color: colors.textPrimary }]}>
                            {consultation.chiefComplaint}
                          </Text>
                        </View>

                        {consultation.symptoms && (
                          <View style={styles.clinicalNoteBlock}>
                            <Text style={[styles.noteHeading, { color: colors.textMuted }]}>
                              Exploración Física / Síntomas:
                            </Text>
                            <Text style={[styles.noteBody, { color: colors.textPrimary }]}>
                              {consultation.symptoms}
                            </Text>
                          </View>
                        )}

                        <View style={styles.clinicalNoteBlock}>
                          <Text style={[styles.noteHeading, { color: colors.textMuted }]}>
                            Plan de Tratamiento:
                          </Text>
                          <Text style={[styles.noteBody, { color: colors.textPrimary }]}>
                            {consultation.treatmentPlan}
                          </Text>
                        </View>

                        {consultation.prescriptionNotes && (
                          <View
                            style={[
                              styles.prescriptionBox,
                              {
                                backgroundColor: colors.surfaceSecondary,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <View style={styles.prescriptionHeader}>
                              <Pill size={15} color={colors.primary} style={{ marginRight: 6 }} />
                              <Text style={[styles.prescriptionTitle, { color: colors.primary }]}>
                                Receta y Medicación Prescrita
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.prescriptionBody,
                                { color: colors.textPrimary },
                              ]}
                            >
                              {consultation.prescriptionNotes}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
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
  patientProfileCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
  },
  profileMainInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 3,
  },
  companyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyNameText: {
    fontSize: 13,
  },
  patientMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginVertical: 3,
  },
  metaLabel: {
    fontSize: 12,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  startConsultationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  startConsultationButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  totalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  totalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyConsultationsBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyConsultationsBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  emptyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCtaButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  allergyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  allergyBannerText: {
    fontSize: 12,
  },
  clinicalNotesHighlightBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
    position: 'relative',
  },
  timelineSpineColumn: {
    width: 22,
    alignItems: 'center',
    marginRight: 10,
    paddingTop: 16,
    position: 'relative',
  },
  timelineNodeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineNodeInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineSpineLine: {
    position: 'absolute',
    top: 36,
    bottom: -16,
    width: 2,
    zIndex: 1,
  },
  consultationCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  consultationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timelineIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
  },
  consultationDate: {
    fontSize: 14,
    fontWeight: '800',
  },
  doctorNameText: {
    fontSize: 11,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
  },
  offlineBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  diagnosisSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  diagnosisLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  diagnosisDescriptionText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  expandedContent: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  vitalsSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  vitalItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  vitalItemFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  bmiPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  bmiPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  vitalItemLabel: {
    fontSize: 11,
    marginRight: 4,
  },
  vitalItemValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  clinicalNotesSection: {
    gap: 10,
  },
  clinicalNoteBlock: {
    marginBottom: 8,
  },
  noteHeading: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  noteBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  prescriptionBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  prescriptionTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  prescriptionBody: {
    fontSize: 12,
    lineHeight: 17,
  },
});
