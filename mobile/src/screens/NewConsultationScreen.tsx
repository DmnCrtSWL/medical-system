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
  Sun,
  Moon,
} from 'lucide-react-native';
import { consultationsService } from '../services/consultations';
import { authService } from '../services/auth';
import { ClinicalConsultationInput, DoctorUser } from '../types';
import { useTheme } from '../context/ThemeContext';

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
  const { isDark, colors, toggleTheme } = useTheme();

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
  const [, setSavedSuccess] = useState(false);

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
    let color = colors.primary;

    if (bmiValue < 18.5) {
      category = 'Bajo peso';
      color = colors.infoText;
    } else if (bmiValue >= 25 && bmiValue < 30) {
      category = 'Sobrepeso';
      color = colors.warningText;
    } else if (bmiValue >= 30) {
      category = 'Obesidad';
      color = colors.dangerText;
    }

    return {
      value: bmiValue.toFixed(1),
      category,
      color,
    };
  }, [weightKg, heightCm, colors]);

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
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.headerBackground}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header con botón de regreso */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Nueva Historia Clínica
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {user?.name || 'Dr. Médico'} • Captura de Consulta
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.themeButton,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            {isDark ? <Sun size={18} color="#FBBF24" /> : <Moon size={18} color={colors.primary} />}
          </TouchableOpacity>
        </View>

        {/* Error de validación */}
        {validationError && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.dangerBg,
                borderColor: colors.dangerBorder,
              },
            ]}
          >
            <AlertCircle size={18} color={colors.dangerText} style={{ marginRight: 8 }} />
            <Text style={[styles.errorText, { color: colors.dangerText }]}>{validationError}</Text>
          </View>
        )}

        {/* SECCIÓN 1: Datos del Paciente y Empresa */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadowColor,
            },
          ]}
        >
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <View
              style={[
                styles.sectionIconBadge,
                {
                  backgroundColor: colors.primaryLight,
                  borderColor: colors.primaryBorder,
                },
              ]}
            >
              <User size={18} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              1. Datos del Trabajador / Paciente
            </Text>
          </View>

          {/* Selector de Empresa */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Empresa Asignada
            </Text>
            <TouchableOpacity
              style={[
                styles.companySelectorButton,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setIsCompanyModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.companySelectorContent}>
                <Building2 size={18} color={colors.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={[styles.companySelectorName, { color: colors.textPrimary }]}>
                    {companyName}
                  </Text>
                  <Text style={[styles.companySelectorSubtitle, { color: colors.textSecondary }]}>
                    Empresa Corporativa In-House Asignada
                  </Text>
                </View>
              </View>
              <ChevronDown size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Nombre Completo */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Nombre del Paciente <Text style={{ color: colors.dangerText }}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <User size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.inputText }]}
                placeholder="Ej. Juan Pérez García"
                placeholderTextColor={colors.inputPlaceholder}
                value={patientName}
                onChangeText={(text) => {
                  setPatientName(text);
                  if (validationError) setValidationError(null);
                }}
              />
            </View>
          </View>

          {/* Fila: Edad y Número de Empleado */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Edad (Años)</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <TextInput
                  style={[styles.textInput, { color: colors.inputText }]}
                  placeholder="34"
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="numeric"
                  value={patientAge}
                  onChangeText={setPatientAge}
                  maxLength={3}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1.4 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                No. Nómina / Empleado
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <Hash size={16} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: colors.inputText }]}
                  placeholder="EMP-1092"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={employeeNumber}
                  onChangeText={setEmployeeNumber}
                />
              </View>
            </View>
          </View>
        </View>

        {/* SECCIÓN 2: Somatometría y Signos Vitales */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadowColor,
            },
          ]}
        >
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <View
              style={[
                styles.sectionIconBadge,
                {
                  backgroundColor: colors.infoBg,
                  borderColor: colors.infoBorder,
                },
              ]}
            >
              <Activity size={18} color={colors.infoText} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              2. Somatometría y Signos Vitales
            </Text>
          </View>

          {/* Grid de Signos Vitales */}
          <View style={styles.vitalsGrid}>
            {/* Presión Arterial */}
            <View
              style={[
                styles.vitalCard,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.vitalHeader}>
                <Heart size={15} color={colors.dangerText} style={{ marginRight: 4 }} />
                <Text style={[styles.vitalLabel, { color: colors.textSecondary }]}>
                  Presión (mmHg)
                </Text>
              </View>
              <View style={styles.vitalSplitRow}>
                <TextInput
                  style={[
                    styles.vitalSmallInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.inputBorder,
                      color: colors.inputText,
                    },
                  ]}
                  placeholder="120"
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="numeric"
                  value={systolic}
                  onChangeText={setSystolic}
                  maxLength={3}
                />
                <Text style={{ color: colors.textMuted, marginHorizontal: 4 }}>/</Text>
                <TextInput
                  style={[
                    styles.vitalSmallInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.inputBorder,
                      color: colors.inputText,
                    },
                  ]}
                  placeholder="80"
                  placeholderTextColor={colors.inputPlaceholder}
                  keyboardType="numeric"
                  value={diastolic}
                  onChangeText={setDiastolic}
                  maxLength={3}
                />
              </View>
            </View>

            {/* Frecuencia Cardíaca */}
            <View
              style={[
                styles.vitalCard,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.vitalHeader}>
                <Activity size={15} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.vitalLabel, { color: colors.textSecondary }]}>Pulso (lpm)</Text>
              </View>
              <TextInput
                style={[
                  styles.vitalSingleInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.inputBorder,
                    color: colors.inputText,
                  },
                ]}
                placeholder="72"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="numeric"
                value={heartRate}
                onChangeText={setHeartRate}
                maxLength={3}
              />
            </View>

            {/* Temperatura */}
            <View
              style={[
                styles.vitalCard,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.vitalHeader}>
                <Thermometer size={15} color={colors.warningText} style={{ marginRight: 4 }} />
                <Text style={[styles.vitalLabel, { color: colors.textSecondary }]}>Temp (°C)</Text>
              </View>
              <TextInput
                style={[
                  styles.vitalSingleInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.inputBorder,
                    color: colors.inputText,
                  },
                ]}
                placeholder="36.5"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="decimal-pad"
                value={temperature}
                onChangeText={setTemperature}
                maxLength={4}
              />
            </View>

            {/* Peso */}
            <View
              style={[
                styles.vitalCard,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.vitalHeader}>
                <Scale size={15} color={colors.infoText} style={{ marginRight: 4 }} />
                <Text style={[styles.vitalLabel, { color: colors.textSecondary }]}>Peso (kg)</Text>
              </View>
              <TextInput
                style={[
                  styles.vitalSingleInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.inputBorder,
                    color: colors.inputText,
                  },
                ]}
                placeholder="70.5"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="decimal-pad"
                value={weightKg}
                onChangeText={setWeightKg}
                maxLength={5}
              />
            </View>

            {/* Talla */}
            <View
              style={[
                styles.vitalCard,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.vitalHeader}>
                <Ruler size={15} color="#A78BFA" style={{ marginRight: 4 }} />
                <Text style={[styles.vitalLabel, { color: colors.textSecondary }]}>Talla (cm)</Text>
              </View>
              <TextInput
                style={[
                  styles.vitalSingleInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.inputBorder,
                    color: colors.inputText,
                  },
                ]}
                placeholder="172"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="numeric"
                value={heightCm}
                onChangeText={setHeightCm}
                maxLength={3}
              />
            </View>

            {/* Cálculo de IMC */}
            <View
              style={[
                styles.vitalCard,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.vitalHeader}>
                <Activity size={15} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.vitalLabel, { color: colors.textSecondary }]}>IMC Calc</Text>
              </View>
              {calculatedBmi ? (
                <View style={styles.bmiResultRow}>
                  <Text style={[styles.bmiValueText, { color: calculatedBmi.color }]}>
                    {calculatedBmi.value}
                  </Text>
                  <Text
                    style={[
                      styles.bmiCategoryText,
                      { color: calculatedBmi.color, borderColor: calculatedBmi.color },
                    ]}
                  >
                    {calculatedBmi.category}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.bmiEmptyText, { color: colors.textMuted }]}>
                  Ingresa peso y talla
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* SECCIÓN 3: Evaluación Médica y Diagnóstico */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              shadowColor: colors.shadowColor,
            },
          ]}
        >
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <View
              style={[
                styles.sectionIconBadge,
                {
                  backgroundColor: colors.primaryLight,
                  borderColor: colors.primaryBorder,
                },
              ]}
            >
              <Stethoscope size={18} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              3. Evaluación Clínica y Diagnóstico
            </Text>
          </View>

          {/* Motivo de Consulta */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Motivo de Consulta <Text style={{ color: colors.dangerText }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                },
              ]}
              placeholder="Ej. Dolor lumbar agudo tras levantamiento de carga en almacén..."
              placeholderTextColor={colors.inputPlaceholder}
              value={chiefComplaint}
              onChangeText={setChiefComplaint}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Síntomas y Exploración */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Exploración Física y Síntomas
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                },
              ]}
              placeholder="Contractura paravertebral L4-L5, arcos de movilidad limitados..."
              placeholderTextColor={colors.inputPlaceholder}
              value={symptoms}
              onChangeText={setSymptoms}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Diagnóstico Ocupacional */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Diagnóstico / Impresión Diagnóstica <Text style={{ color: colors.dangerText }}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <FileText size={18} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.inputText }]}
                placeholder="Ej. Lumbalgia Mecánica Ocupacional (CIE-10 M54.5)"
                placeholderTextColor={colors.inputPlaceholder}
                value={diagnosisDescription}
                onChangeText={setDiagnosisDescription}
              />
            </View>
          </View>

          {/* Plan de Tratamiento */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Plan de Tratamiento y Reposo <Text style={{ color: colors.dangerText }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                },
              ]}
              placeholder="Reposo relativo por 48 horas, higiene postural, aplicación de frío/calor..."
              placeholderTextColor={colors.inputPlaceholder}
              value={treatmentPlan}
              onChangeText={setTreatmentPlan}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Receta y Medicamentos */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Receta / Medicación Prescrita
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <Pill size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.inputText }]}
                placeholder="Ej. Ibuprofeno 400mg c/8h por 3 días, Paracetamol 500mg..."
                placeholderTextColor={colors.inputPlaceholder}
                value={prescriptionNotes}
                onChangeText={setPrescriptionNotes}
              />
            </View>
          </View>
        </View>

        {/* Botón Guardar Consulta */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
            isSaving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>
              Guardando Consulta...
            </Text>
          ) : (
            <View style={styles.saveButtonContent}>
              <Save size={20} color={colors.textInverse} style={{ marginRight: 8 }} />
              <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>
                Guardar Historia Clínica
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.footerNote}>
          <Text style={[styles.footerNoteText, { color: colors.textMuted }]}>
            Los datos se guardan de forma segura localmente con cifrado y se sincronizan en cuanto
            haya conexión.
          </Text>
        </View>
      </ScrollView>

      {/* Modal Selector de Empresa */}
      <Modal
        visible={isCompanyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCompanyModalVisible(false)}
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
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Seleccionar Empresa
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Empresas cliente asignadas a tu cuenta
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => setIsCompanyModalVisible(false)}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              {assignedCompanies.map((comp) => {
                const isSelected = companyName === comp.name;
                return (
                  <TouchableOpacity
                    key={comp.id}
                    style={[
                      styles.companyOptionCard,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : colors.surfaceSecondary,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setCompanyName(comp.name);
                      setIsCompanyModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.companyOptionIcon,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.card,
                        },
                      ]}
                    >
                      <Building2
                        size={20}
                        color={isSelected ? colors.textInverse : colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.companyOptionName,
                          { color: isSelected ? colors.primary : colors.textPrimary },
                        ]}
                      >
                        {comp.name}
                      </Text>
                      <Text
                        style={[styles.companyOptionSubtitle, { color: colors.textSecondary }]}
                      >
                        {comp.subtitle}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color={colors.primary} />}
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 40,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  headerTextContainer: {
    flex: 1,
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
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  sectionCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
  },
  textArea: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  companySelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  companySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companySelectorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  companySelectorSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vitalCard: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  vitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  vitalLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  vitalSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vitalSmallInput: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  vitalSingleInput: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  bmiResultRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  bmiValueText: {
    fontSize: 15,
    fontWeight: '800',
  },
  bmiCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
  },
  bmiEmptyText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
  },
  saveButton: {
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  footerNote: {
    marginTop: 14,
    alignItems: 'center',
  },
  footerNoteText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
  companyOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  companyOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyOptionName: {
    fontSize: 15,
    fontWeight: '700',
  },
  companyOptionSubtitle: {
    fontSize: 12,
  },
});
