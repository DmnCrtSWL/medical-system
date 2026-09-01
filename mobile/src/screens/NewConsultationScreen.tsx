import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Alert,
  Modal,
} from 'react-native';
import {
  ArrowLeft,
  User,
  Building2,
  Activity,
  Heart,
  Thermometer,
  Scale,
  Ruler,
  Stethoscope,
  FileText,
  Pill,
  Save,
  CheckCircle2,
  AlertCircle,
  Hash,
  ChevronDown,
  Check,
  X,
} from 'lucide-react-native';
import { consultationsService } from '../services/consultations';
import { authService } from '../services/auth';
import { ClinicalConsultationInput, DoctorUser } from '../types';

interface AssignedCompany {
  id: string;
  name: string;
  subtitle: string;
}

interface NewConsultationScreenProps {
  user?: DoctorUser | null;
  initialPatientData?: {
    name: string;
    companyName?: string;
    employeeNumber?: string;
    age?: number;
  } | null;
  onBack: () => void;
  onSaveSuccess: () => void;
}

export const NewConsultationScreen: React.FC<NewConsultationScreenProps> = ({
  user,
  initialPatientData,
  onBack,
  onSaveSuccess,
}) => {
  // Estado del Paciente y Empresa Asignada
  const [patientName, setPatientName] = useState(initialPatientData?.name || '');
  const [patientAge, setPatientAge] = useState(
    initialPatientData?.age ? String(initialPatientData.age) : ''
  );
  const [companyName, setCompanyName] = useState<string>(
    initialPatientData?.companyName || 'McDonalds'
  );
  const [employeeNumber, setEmployeeNumber] = useState(
    initialPatientData?.employeeNumber || ''
  );
  const [isCompanyModalVisible, setIsCompanyModalVisible] = useState<boolean>(false);

  // Cargar empresa real asignada en la base de datos al montar la pantalla
  useEffect(() => {
    if (initialPatientData) {
      if (initialPatientData.name) setPatientName(initialPatientData.name);
      if (initialPatientData.companyName) setCompanyName(initialPatientData.companyName);
      if (initialPatientData.employeeNumber) setEmployeeNumber(initialPatientData.employeeNumber);
      if (initialPatientData.age) setPatientAge(String(initialPatientData.age));
      return;
    }

    const fetchCompany = async () => {
      const liveCompany = await authService.getDoctorAssignedCompany();
      if (liveCompany) {
        setCompanyName(liveCompany);
      }
    };
    fetchCompany();
  }, [initialPatientData]);

  // Lista de empresas asignadas al doctor logueado
  const assignedCompanies = useMemo(() => {
    return [
      {
        id: '1',
        name: companyName,
        subtitle: 'Empresa Corporativa In-House Asignada',
      },
    ];
  }, [companyName]);

  // Signos Vitales
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');

  // Evaluación Médica
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosisDescription, setDiagnosisDescription] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Cálculo de IMC automático en tiempo real
  const calculatedBmi = useMemo(() => {
    const weight = parseFloat(weightKg);
    const height = parseFloat(heightCm);

    if (!weight || !height || height <= 0) {
      return null;
    }

    const heightInMeters = height / 100;
    const bmiValue = weight / (heightInMeters * heightInMeters);

    let category = 'Normal';
    let color = '#34D399'; // Verde

    if (bmiValue < 18.5) {
      category = 'Bajo peso';
      color = '#60A5FA'; // Azul
    } else if (bmiValue >= 25 && bmiValue < 30) {
      category = 'Sobrepeso';
      color = '#FBBF24'; // Amarillo
    } else if (bmiValue >= 30) {
      category = 'Obesidad';
      color = '#F87171'; // Rojo
    }

    return {
      value: bmiValue.toFixed(1),
      category,
      color,
    };
  }, [weightKg, heightCm]);

  const handleSave = async () => {
    setValidationError(null);

    // Validaciones obligatorias mínimas
    if (!patientName.trim()) {
      setValidationError('El nombre del paciente es obligatorio.');
      return;
    }
    if (!chiefComplaint.trim()) {
      setValidationError('El motivo de la consulta es obligatorio.');
      return;
    }
    if (!diagnosisDescription.trim()) {
      setValidationError('El diagnóstico médico es obligatorio.');
      return;
    }
    if (!treatmentPlan.trim()) {
      setValidationError('El plan de tratamiento es obligatorio.');
      return;
    }

    setIsSaving(true);

    try {
      const payload: ClinicalConsultationInput = {
        patientName: patientName.trim(),
        patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
        companyName: companyName.trim(),
        employeeNumber: employeeNumber ? employeeNumber.trim() : undefined,
        chiefComplaint: chiefComplaint.trim(),
        symptoms: symptoms.trim(),
        diagnosisDescription: diagnosisDescription.trim(),
        treatmentPlan: treatmentPlan.trim(),
        prescriptionNotes: prescriptionNotes.trim() || undefined,
        vitalSigns: {
          bloodPressureSystolic: systolic ? parseInt(systolic, 10) : undefined,
          bloodPressureDiastolic: diastolic ? parseInt(diastolic, 10) : undefined,
          heartRate: heartRate ? parseInt(heartRate, 10) : undefined,
          temperature: temperature ? parseFloat(temperature) : undefined,
          weightKg: weightKg ? parseFloat(weightKg) : undefined,
          heightCm: heightCm ? parseFloat(heightCm) : undefined,
          bmi: calculatedBmi ? parseFloat(calculatedBmi.value) : undefined,
        },
      };

      await consultationsService.saveConsultation(payload);

      setSavedSuccess(true);

      const msg = 'Historia clínica guardada exitosamente en el dispositivo.';
      if (Platform.OS === 'web') {
        alert(msg);
        onSaveSuccess();
      } else {
        Alert.alert('Consulta Guardada', msg, [
          {
            text: 'Aceptar',
            onPress: onSaveSuccess,
          },
        ]);
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Error al guardar la consulta.';
      setValidationError(errMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header Superior */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Volver al inicio"
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Nueva Historia Clínica</Text>
          <Text style={styles.headerSubtitle}>Captura de Consulta Offline</Text>
        </View>
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineBadgeText}>Modo Local</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner de Validación / Éxito */}
        {validationError && (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color="#F87171" style={styles.bannerIcon} />
            <Text style={styles.errorText}>{validationError}</Text>
          </View>
        )}

        {savedSuccess && (
          <View style={styles.successBanner}>
            <CheckCircle2 size={18} color="#34D399" style={styles.bannerIcon} />
            <Text style={styles.successText}>
              Consulta guardada exitosamente en el almacenamiento local.
            </Text>
          </View>
        )}

        {/* SECCIÓN 1: DATOS DEL PACIENTE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBadge}>
              <User size={18} color="#34D399" />
            </View>
            <Text style={styles.sectionTitle}>1. Datos del Paciente</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Nombre Completo del Trabajador <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Juan Pérez López"
              placeholderTextColor="#64748B"
              value={patientName}
              onChangeText={setPatientName}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
              <Text style={styles.label}>Edad</Text>
              <TextInput
                style={styles.input}
                placeholder="32"
                placeholderTextColor="#64748B"
                value={patientAge}
                onChangeText={setPatientAge}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
              <Text style={styles.label}>N° Ficha / Empleado</Text>
              <TextInput
                style={styles.input}
                placeholder="EMP-1049"
                placeholderTextColor="#64748B"
                value={employeeNumber}
                onChangeText={setEmployeeNumber}
              />
            </View>
          </View>

          {/* Selector Táctil de Empresa Asignada */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Empresa / Planta Asignada</Text>
            <TouchableOpacity
              style={styles.companySelectorCard}
              onPress={() => {
                if (assignedCompanies.length > 1) {
                  setIsCompanyModalVisible(true);
                }
              }}
              activeOpacity={assignedCompanies.length > 1 ? 0.8 : 1}
            >
              <View style={styles.companySelectorLeft}>
                <View style={styles.companyIconBadge}>
                  <Building2 size={18} color="#34D399" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedCompanyName}>{companyName}</Text>
                  <Text style={styles.selectedCompanySubtitle}>
                    {assignedCompanies.length > 1
                      ? 'Toca para cambiar de empresa o planta'
                      : 'Empresa Corporativa Asignada (In-House)'}
                  </Text>
                </View>
              </View>
              {assignedCompanies.length > 1 ? (
                <ChevronDown size={18} color="#94A3B8" />
              ) : (
                <View style={styles.checkBadgeSmall}>
                  <Check size={12} color="#34D399" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* SECCIÓN 2: SIGNOS VITALES & IMC */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Activity size={18} color="#60A5FA" />
            </View>
            <Text style={styles.sectionTitle}>2. Signos Vitales & Somatometría</Text>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
              <Text style={styles.label}>Presión Sistólica (mmHg)</Text>
              <TextInput
                style={styles.input}
                placeholder="120"
                placeholderTextColor="#64748B"
                value={systolic}
                onChangeText={setSystolic}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
              <Text style={styles.label}>Presión Diastólica (mmHg)</Text>
              <TextInput
                style={styles.input}
                placeholder="80"
                placeholderTextColor="#64748B"
                value={diastolic}
                onChangeText={setDiastolic}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
              <Text style={styles.label}>Frecuencia Cardíaca (lpm)</Text>
              <View style={styles.inputWithIcon}>
                <Heart size={16} color="#F87171" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInside}
                  placeholder="75"
                  placeholderTextColor="#64748B"
                  value={heartRate}
                  onChangeText={setHeartRate}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
              <Text style={styles.label}>Temperatura (°C)</Text>
              <View style={styles.inputWithIcon}>
                <Thermometer size={16} color="#FBBF24" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInside}
                  placeholder="36.5"
                  placeholderTextColor="#64748B"
                  value={temperature}
                  onChangeText={setTemperature}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
              <Text style={styles.label}>Peso (kg)</Text>
              <View style={styles.inputWithIcon}>
                <Scale size={16} color="#34D399" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInside}
                  placeholder="74.5"
                  placeholderTextColor="#64748B"
                  value={weightKg}
                  onChangeText={setWeightKg}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
              <Text style={styles.label}>Altura (cm)</Text>
              <View style={styles.inputWithIcon}>
                <Ruler size={16} color="#60A5FA" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInside}
                  placeholder="175"
                  placeholderTextColor="#64748B"
                  value={heightCm}
                  onChangeText={setHeightCm}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Widget de Cálculo Automático de IMC */}
          {calculatedBmi && (
            <View style={[styles.bmiCard, { borderColor: calculatedBmi.color }]}>
              <View style={styles.bmiInfo}>
                <Text style={styles.bmiTitle}>Índice de Masa Corporal (IMC)</Text>
                <Text style={[styles.bmiValue, { color: calculatedBmi.color }]}>
                  {calculatedBmi.value} kg/m²
                </Text>
              </View>
              <View style={[styles.bmiBadge, { backgroundColor: `${calculatedBmi.color}20` }]}>
                <Text style={[styles.bmiBadgeText, { color: calculatedBmi.color }]}>
                  {calculatedBmi.category}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* SECCIÓN 3: EVALUACIÓN CLÍNICA & TRATAMIENTO */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
              <Stethoscope size={18} color="#FBBF24" />
            </View>
            <Text style={styles.sectionTitle}>3. Diagnóstico & Tratamiento</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Motivo de Consulta <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Dolor lumbar agudo tras maniobra de carga"
              placeholderTextColor="#64748B"
              value={chiefComplaint}
              onChangeText={setChiefComplaint}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Síntomas / Exploración Física</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe síntomas referidos, tiempo de evolución y hallazgos a la exploración..."
              placeholderTextColor="#64748B"
              value={symptoms}
              onChangeText={setSymptoms}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Diagnóstico Médico <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Cefalea Tensional / Fatiga Ocular Laboral"
              placeholderTextColor="#64748B"
              value={diagnosisDescription}
              onChangeText={setDiagnosisDescription}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Plan de Tratamiento e Indicaciones <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Paracetamol 500mg cada 8 horas por 3 días. Hidratación constante y pausas activas..."
              placeholderTextColor="#64748B"
              value={treatmentPlan}
              onChangeText={setTreatmentPlan}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observaciones o Notas de Incapacidad (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Apto para continuar labores con descansos visuales cada hora."
              placeholderTextColor="#64748B"
              value={prescriptionNotes}
              onChangeText={setPrescriptionNotes}
            />
          </View>
        </View>

        {/* Botón de Guardar Consulta */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Save size={20} color="#0F172A" style={{ marginRight: 10 }} />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Guardando...' : 'Guardar Consulta en Dispositivo'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            El expediente se guardará de forma segura en este dispositivo y se subirá automáticamente
            al servidor cuando haya conexión.
          </Text>
        </View>
      </ScrollView>

      {/* Modal Selector de Empresa Asignada */}
      <Modal
        visible={isCompanyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCompanyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Empresa Asignada</Text>
                <Text style={styles.modalSubtitle}>Selecciona la empresa o planta del trabajador</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsCompanyModalVisible(false)}
              >
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              {assignedCompanies.map((company) => {
                const isSelected = company.name === companyName;
                return (
                  <TouchableOpacity
                    key={company.id}
                    style={[styles.companyOptionCard, isSelected && styles.companyOptionCardSelected]}
                    onPress={() => {
                      setCompanyName(company.name);
                      setIsCompanyModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.companyOptionIcon, isSelected && styles.companyOptionIconSelected]}>
                      <Building2 size={20} color={isSelected ? '#34D399' : '#94A3B8'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.companyOptionName, isSelected && styles.companyOptionNameSelected]}>
                        {company.name}
                      </Text>
                      <Text style={styles.companyOptionSubtitle}>{company.subtitle}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Check size={14} color="#0F172A" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  offlineBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  offlineBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    marginBottom: 16,
  },
  successText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  bannerIcon: {
    marginRight: 10,
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  required: {
    color: '#F87171',
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputInside: {
    flex: 1,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  companySelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  companySelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  selectedCompanyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectedCompanySubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  bmiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    borderWidth: 1,
  },
  bmiInfo: {
    flex: 1,
  },
  bmiTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  bmiValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  bmiBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  bmiBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34D399',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  footerNote: {
    marginTop: 14,
    alignItems: 'center',
  },
  footerNoteText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
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
  companyOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  companyOptionCardSelected: {
    borderColor: '#34D399',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  companyOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyOptionIconSelected: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  companyOptionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  companyOptionNameSelected: {
    color: '#34D399',
  },
  companyOptionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#34D399',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkBadgeSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
