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
} from 'lucide-react-native';
import { patientsService } from '../services/patients';
import { PatientHistoryResponse, PatientHistoryItem } from '../types';

interface PatientHistoryScreenProps {
  patientId: string;
  patientName?: string;
  onBack: () => void;
  onNewConsultationForPatient: (patientInfo: {
    name: string;
    companyName?: string;
    employeeNumber?: string;
    age?: number;
  }) => void;
}

export const PatientHistoryScreen: React.FC<PatientHistoryScreenProps> = ({
  patientId,
  patientName,
  onBack,
  onNewConsultationForPatient,
}) => {
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
        month: 'long',
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
    if (bmi < 18.5) return { label: 'Bajo peso', color: '#60A5FA' };
    if (bmi < 25) return { label: 'Normal', color: '#34D399' };
    if (bmi < 30) return { label: 'Sobrepeso', color: '#FBBF24' };
    return { label: 'Obesidad', color: '#F87171' };
  };

  const handleStartConsultation = () => {
    if (!historyData) return;
    onNewConsultationForPatient({
      name: historyData.patient.name,
      companyName: historyData.patient.companyName,
      employeeNumber: historyData.patient.employeeNumber || undefined,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Regresar al directorio"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Expediente Clínico</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {patientName || historyData?.patient.name || 'Detalle del Paciente'}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#34D399" />
          <Text style={styles.loadingText}>Cargando historial clínico...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Tarjeta de Información General del Paciente */}
          {historyData && (
            <View style={styles.patientProfileCard}>
              <View style={styles.profileHeaderRow}>
                <View style={styles.avatarBadge}>
                  <User size={28} color="#34D399" />
                </View>
                <View style={styles.profileMainInfo}>
                  <Text style={styles.patientName}>{historyData.patient.name}</Text>
                  <View style={styles.companyBadgeRow}>
                    <Building2 size={13} color="#34D399" style={{ marginRight: 4 }} />
                    <Text style={styles.companyNameText}>{historyData.patient.companyName}</Text>
                  </View>
                </View>
              </View>

              {/* Grid de Metadatos del Paciente */}
              <View style={styles.patientMetaGrid}>
                {historyData.patient.employeeNumber && (
                  <View style={styles.metaItem}>
                    <Hash size={13} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.metaLabel}>Nómina: </Text>
                    <Text style={styles.metaValue}>{historyData.patient.employeeNumber}</Text>
                  </View>
                )}

                <View style={styles.metaItem}>
                  <FileText size={13} color="#34D399" style={{ marginRight: 4 }} />
                  <Text style={styles.metaLabel}>Consultas: </Text>
                  <Text style={[styles.metaValue, { color: '#34D399' }]}>
                    {historyData.patient.totalConsultations}
                  </Text>
                </View>

                {historyData.patient.phone && (
                  <View style={styles.metaItem}>
                    <Phone size={13} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.metaValue}>{historyData.patient.phone}</Text>
                  </View>
                )}

                {historyData.patient.email && (
                  <View style={styles.metaItem}>
                    <Mail size={13} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.metaValue}>{historyData.patient.email}</Text>
                  </View>
                )}
              </View>

              {/* Botón de Iniciar Nueva Consulta Directa */}
              <TouchableOpacity
                style={styles.startConsultationButton}
                onPress={handleStartConsultation}
                activeOpacity={0.8}
              >
                <Plus size={18} color="#0F172A" style={{ marginRight: 8 }} />
                <Text style={styles.startConsultationButtonText}>
                  Iniciar Nueva Consulta para este Paciente
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sección de Historial de Visitas */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Historial de Consultas Médicas</Text>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>
                {historyData?.consultations.length || 0} Registros
              </Text>
            </View>
          </View>

          {/* Lista de Consultas */}
          {historyData?.consultations.length === 0 ? (
            <View style={styles.emptyConsultationsBox}>
              <CheckCircle2 size={40} color="#34D399" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>Sin consultas previas</Text>
              <Text style={styles.emptySubtitle}>
                Este paciente aún no tiene visitas registradas en el historial.
              </Text>
            </View>
          ) : (
            historyData?.consultations.map((consultation: PatientHistoryItem, index: number) => {
              const isExpanded = expandedIds.has(consultation.id);
              const bmiInfo = getBmiCategoryInfo(consultation.vitalSigns?.bmi);

              return (
                <View
                  key={consultation.id || index}
                  style={[
                    styles.consultationCard,
                    isExpanded && { borderColor: 'rgba(52, 211, 153, 0.4)' },
                  ]}
                >
                  {/* Encabezado de la Consulta */}
                  <TouchableOpacity
                    style={styles.consultationHeader}
                    onPress={() => toggleExpand(consultation.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.consultationHeaderLeft}>
                      <View style={styles.timelineIcon}>
                        <Calendar size={16} color="#34D399" />
                      </View>
                      <View>
                        <Text style={styles.consultationDate}>
                          {formatDate(consultation.consultationDate)}
                        </Text>
                        <Text style={styles.doctorNameText}>
                          Atendido por: {consultation.doctorName}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.headerRightActions}>
                      {consultation.status === 'LOCAL_PENDING' && (
                        <View style={styles.offlineBadge}>
                          <Clock size={11} color="#FBBF24" style={{ marginRight: 3 }} />
                          <Text style={styles.offlineBadgeText}>Pendiente</Text>
                        </View>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={20} color="#64748B" />
                      ) : (
                        <ChevronDown size={20} color="#64748B" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Diagnóstico Resumido (Siempre visible) */}
                  <View style={styles.diagnosisSummaryBox}>
                    <Stethoscope size={16} color="#34D399" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.diagnosisLabel}>Diagnóstico / Impresión Clínica:</Text>
                      <Text style={styles.diagnosisDescriptionText}>
                        {consultation.diagnosisDescription}
                      </Text>
                    </View>
                  </View>

                  {/* Detalle Expandible de la Consulta */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {/* Signos Vitales Históricos */}
                      <Text style={styles.subSectionTitle}>Somatometría Registrada:</Text>

                      <View style={styles.vitalsSummaryGrid}>
                        {/* Presión */}
                        <View style={styles.vitalItem}>
                          <Heart size={14} color="#F87171" style={{ marginRight: 4 }} />
                          <Text style={styles.vitalItemLabel}>Presión:</Text>
                          <Text style={styles.vitalItemValue}>
                            {consultation.vitalSigns?.bloodPressureSystolic &&
                            consultation.vitalSigns?.bloodPressureDiastolic
                              ? `${consultation.vitalSigns.bloodPressureSystolic}/${consultation.vitalSigns.bloodPressureDiastolic} mmHg`
                              : 'N/A'}
                          </Text>
                        </View>

                        {/* Pulso */}
                        <View style={styles.vitalItem}>
                          <Activity size={14} color="#34D399" style={{ marginRight: 4 }} />
                          <Text style={styles.vitalItemLabel}>Pulso:</Text>
                          <Text style={styles.vitalItemValue}>
                            {consultation.vitalSigns?.heartRate
                              ? `${consultation.vitalSigns.heartRate} lpm`
                              : 'N/A'}
                          </Text>
                        </View>

                        {/* Temperatura */}
                        <View style={styles.vitalItem}>
                          <Thermometer size={14} color="#FBBF24" style={{ marginRight: 4 }} />
                          <Text style={styles.vitalItemLabel}>Temp:</Text>
                          <Text style={styles.vitalItemValue}>
                            {consultation.vitalSigns?.temperature
                              ? `${consultation.vitalSigns.temperature} °C`
                              : 'N/A'}
                          </Text>
                        </View>

                        {/* IMC */}
                        <View style={styles.vitalItem}>
                          <Scale size={14} color="#60A5FA" style={{ marginRight: 4 }} />
                          <Text style={styles.vitalItemLabel}>IMC:</Text>
                          <Text
                            style={[
                              styles.vitalItemValue,
                              { color: bmiInfo ? bmiInfo.color : '#FFFFFF' },
                            ]}
                          >
                            {consultation.vitalSigns?.bmi ? consultation.vitalSigns.bmi : 'N/A'}
                          </Text>
                        </View>
                      </View>

                      {/* Motivo de Consulta y Exploración */}
                      <View style={styles.clinicalNotesSection}>
                        <View style={styles.clinicalNoteBlock}>
                          <Text style={styles.noteHeading}>Motivo de Consulta:</Text>
                          <Text style={styles.noteBody}>{consultation.chiefComplaint}</Text>
                        </View>

                        {consultation.symptoms && (
                          <View style={styles.clinicalNoteBlock}>
                            <Text style={styles.noteHeading}>Exploración Física / Síntomas:</Text>
                            <Text style={styles.noteBody}>{consultation.symptoms}</Text>
                          </View>
                        )}

                        <View style={styles.clinicalNoteBlock}>
                          <Text style={styles.noteHeading}>Plan de Tratamiento:</Text>
                          <Text style={styles.noteBody}>{consultation.treatmentPlan}</Text>
                        </View>

                        {consultation.prescriptionNotes && (
                          <View style={styles.prescriptionBox}>
                            <View style={styles.prescriptionHeader}>
                              <Pill size={15} color="#34D399" style={{ marginRight: 6 }} />
                              <Text style={styles.prescriptionTitle}>
                                Receta y Medicación Prescrita
                              </Text>
                            </View>
                            <Text style={styles.prescriptionBody}>
                              {consultation.prescriptionNotes}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
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
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
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
    color: '#94A3B8',
    fontWeight: '500',
  },
  patientProfileCard: {
    backgroundColor: '#1E293B',
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  profileMainInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  companyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyNameText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  patientMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginVertical: 3,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  startConsultationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#34D399',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  startConsultationButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
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
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  totalBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  totalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  emptyConsultationsBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  consultationCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
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
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  consultationDate: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  doctorNameText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  offlineBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FBBF24',
  },
  diagnosisSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  diagnosisLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  diagnosisDescriptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  expandedContent: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
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
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  vitalItemLabel: {
    fontSize: 11,
    color: '#64748B',
    marginRight: 4,
  },
  vitalItemValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
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
    color: '#94A3B8',
    marginBottom: 3,
  },
  noteBody: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  prescriptionBox: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
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
    color: '#34D399',
  },
  prescriptionBody: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 17,
  },
});
