import React, { useState, useMemo } from 'react';
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
} from 'lucide-react-native';
import { consultationsService } from '../services/consultations';
import { ClinicalConsultationInput } from '../types';

interface NewConsultationScreenProps {
  onBack: () => void;
  onSaveSuccess: () => void;
}

export const NewConsultationScreen: React.FC<NewConsultationScreenProps> = ({
  onBack,
  onSaveSuccess,
}) => {
  // Estado del Paciente
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [companyName, setCompanyName] = useState('TechCorp Mexico');
  const [employeeNumber, setEmployeeNumber] = useState('');

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
    if (weight > 0 && height > 0) {
      const heightM = height / 100;
      const bmi = weight / (heightM * heightM);
      return parseFloat(bmi.toFixed(1));
    }
    return null;
  }, [weightKg, heightCm]);

  const bmiCategory = useMemo(() => {
    if (!calculatedBmi) return null;
    if (calculatedBmi < 18.5) {
      return { label: 'Bajo peso', color: '#60A5FA', bg: 'rgba(59, 130, 246, 0.15)' };
    }
    if (calculatedBmi < 25) {
      return { label: 'Peso Normal (Saludable)', color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)' };
    }
    if (calculatedBmi < 30) {
      return { label: 'Sobrepeso', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' };
    }
    return { label: 'Obesidad', color: '#F87171', bg: 'rgba(248, 113, 113, 0.15)' };
  }, [calculatedBmi]);

  const handleSave = async () => {
    setValidationError(null);

    // Validaciones obligatorias
    if (!patientName.trim()) {
      setValidationError('El nombre del paciente es obligatorio.');
      return;
    }
    if (!chiefComplaint.trim()) {
      setValidationError('El motivo de consulta es obligatorio.');
      return;
    }
    if (!diagnosisDescription.trim()) {
      setValidationError('El diagnóstico médico es obligatorio.');
      return;
    }
    if (!treatmentPlan.trim()) {
      setValidationError('El plan de tratamiento o receta es obligatorio.');
      return;
    }

    setIsSaving(true);

    try {
      const consultationInput: ClinicalConsultationInput = {
        patientName: patientName.trim(),
        patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
        companyName: companyName.trim() || undefined,
        employeeNumber: employeeNumber.trim() || undefined,
        chiefComplaint: chiefComplaint.trim(),
        symptoms: symptoms.trim() || chiefComplaint.trim(),
        vitalSigns: {
          bloodPressureSystolic: systolic ? parseInt(systolic, 10) : undefined,
          bloodPressureDiastolic: diastolic ? parseInt(diastolic, 10) : undefined,
          heartRate: heartRate ? parseInt(heartRate, 10) : undefined,
          temperature: temperature ? parseFloat(temperature) : undefined,
          weightKg: weightKg ? parseFloat(weightKg) : undefined,
          heightCm: heightCm ? parseFloat(heightCm) : undefined,
          bmi: calculatedBmi || undefined,
        },
        diagnosisDescription: diagnosisDescription.trim(),
        treatmentPlan: treatmentPlan.trim(),
        prescriptionNotes: prescriptionNotes.trim() || undefined,
      };

      await consultationsService.saveConsultation(consultationInput);

      setSavedSuccess(true);

      if (Platform.OS !== 'web') {
        Alert.alert(
          'Consulta Guardada',
          'La historia clínica se guardó localmente en el dispositivo y quedó lista para sincronizar.',
          [{ text: 'OK', onPress: onSaveSuccess }]
        );
      } else {
        setTimeout(() => {
          onSaveSuccess();
        }, 1200);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setValidationError(err.message);
      } else {
        setValidationError('Ocurrió un error al guardar la consulta.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              placeholder="Ej. Juan Pérez González"
              placeholderTextColor="#64748B"
              value={patientName}
              onChangeText={setPatientName}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
              <Text style={styles.label}>Edad (Años)</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Empresa / Planta Asignada</Text>
            <View style={styles.inputWithIcon}>
              <Building2 size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.inputInside}
                placeholder="TechCorp Mexico (Planta 1)"
                placeholderTextColor="#64748B"
                value={companyName}
                onChangeText={setCompanyName}
              />
            </View>
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

          {/* Presión y Frecuencia */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
              <Text style={styles.label}>P.A. Sistólica (mmHg)</Text>
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
              <Text style={styles.label}>P.A. Diastólica (mmHg)</Text>
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

          {/* Frecuencia y Temperatura */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
              <Text style={styles.label}>Frec. Cardíaca (bpm)</Text>
              <TextInput
                style={styles.input}
                placeholder="72"
                placeholderTextColor="#64748B"
                value={heartRate}
                onChangeText={setHeartRate}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
              <Text style={styles.label}>Temperatura (°C)</Text>
              <TextInput
                style={styles.input}
                placeholder="36.5"
                placeholderTextColor="#64748B"
                value={temperature}
                onChangeText={setTemperature}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Peso y Altura */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
              <Text style={styles.label}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="75.0"
                placeholderTextColor="#64748B"
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
              <Text style={styles.label}>Altura (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="175"
                placeholderTextColor="#64748B"
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* IMC Calculado */}
          {calculatedBmi !== null && bmiCategory && (
            <View style={[styles.bmiCard, { backgroundColor: bmiCategory.bg, borderColor: bmiCategory.color }]}>
              <View style={styles.bmiHeader}>
                <Text style={styles.bmiTitle}>Índice de Masa Corporal (IMC)</Text>
                <Text style={[styles.bmiValue, { color: bmiCategory.color }]}>{calculatedBmi} kg/m²</Text>
              </View>
              <Text style={[styles.bmiCategoryText, { color: bmiCategory.color }]}>
                Estado: {bmiCategory.label}
              </Text>
            </View>
          )}
        </View>

        {/* SECCIÓN 3: EVALUACIÓN CLÍNICA */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Stethoscope size={18} color="#FBBF24" />
            </View>
            <Text style={styles.sectionTitle}>3. Diagnóstico y Tratamiento</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Motivo de Consulta <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Cefalea frontal intensa, fatiga y dolor ocular tras jornada..."
              placeholderTextColor="#64748B"
              value={chiefComplaint}
              onChangeText={setChiefComplaint}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Síntomas Adicionales / Exploración Física</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Faringe congestiva sin exudado, campos pulmonares limpios..."
              placeholderTextColor="#64748B"
              value={symptoms}
              onChangeText={setSymptoms}
              multiline
              numberOfLines={2}
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

        {/* Botón de Guardado */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Save size={20} color="#0F172A" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Guardando en Dispositivo...' : 'Guardar Consulta en Dispositivo'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    marginRight: 14,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 50,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  bannerIcon: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#FCA5A5',
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: '#34D399',
    fontWeight: '600',
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
    color: '#CBD5E1',
    marginBottom: 6,
  },
  required: {
    color: '#F87171',
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  bmiCard: {
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
  },
  bmiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bmiTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  bmiValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  bmiCategoryText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#34D399',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
});
