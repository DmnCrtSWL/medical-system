import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
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
} from 'lucide-react-native';
import { DoctorUser } from '../types';

interface HomeScreenProps {
  user: DoctorUser;
  onLogout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ user, onLogout }) => {
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
            <Text style={styles.doctorName}>{user.name || 'Médico General'}</Text>
            <Text style={styles.doctorEmail}>{user.email}</Text>
            <View style={styles.companyChip}>
              <Building2 size={12} color="#34D399" />
              <Text style={styles.companyText}>
                {user.role === 'DOCTOR' ? 'Médico Certificado In-House' : `Rol: ${user.role}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

        <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
          <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
            <FileSpreadsheet size={24} color="#34D399" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Nueva Historia Clínica</Text>
            <Text style={styles.actionDescription}>Captura datos de consulta en modo local/offline</Text>
          </View>
          <ChevronRight size={20} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
          <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <RefreshCw size={24} color="#60A5FA" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Cola de Sincronización</Text>
            <Text style={styles.actionDescription}>0 expedientes pendientes por subir al servidor</Text>
          </View>
          <ChevronRight size={20} color="#64748B" />
        </TouchableOpacity>

        {/* System Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>MedSys Native Engine v1.0.0</Text>
          <Text style={styles.footerSubtext}>Sesión autenticada vía JWT Seguro</Text>
        </View>
      </ScrollView>
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
});
