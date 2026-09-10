export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryLight: string;
  primaryBorder: string;
  card: string;
  cardBorder: string;
  cardHeader: string;
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;
  inputText: string;
  headerBackground: string;
  headerBorder: string;
  modalOverlay: string;
  modalContainer: string;
  modalBorder: string;
  statusOnlineBg: string;
  statusOnlineText: string;
  statusOnlineBorder: string;
  statusOfflineBg: string;
  statusOfflineText: string;
  statusOfflineBorder: string;
  warningBg: string;
  warningText: string;
  warningBorder: string;
  infoBg: string;
  infoText: string;
  infoBorder: string;
  dangerBg: string;
  dangerText: string;
  dangerBorder: string;
  shadowColor: string;
  phoneOuterBg: string;
  phoneShellBorder: string;
  phoneGlow: string;
}

export const lightTheme: ThemeColors = {
  background: '#FAFCFD', // Blanco inmaculado clínico sutil
  surface: '#FFFFFF',
  surfaceSecondary: '#F4F7F9',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  primary: '#0D9488', // Verde esmeralda quirúrgico tenue y elegante
  primaryLight: 'rgba(13, 148, 136, 0.08)',
  primaryBorder: 'rgba(13, 148, 136, 0.20)',
  card: '#FFFFFF',
  cardBorder: '#E6EDF2',
  cardHeader: '#FAFCFD',
  inputBackground: '#FFFFFF',
  inputBorder: '#E2E8F0',
  inputPlaceholder: '#94A3B8',
  inputText: '#0F172A',
  headerBackground: '#FFFFFF',
  headerBorder: '#EAEFF4',
  modalOverlay: 'rgba(15, 23, 42, 0.4)',
  modalContainer: '#FFFFFF',
  modalBorder: '#E2E8F0',
  statusOnlineBg: 'rgba(13, 148, 136, 0.08)',
  statusOnlineText: '#0D9488',
  statusOnlineBorder: 'rgba(13, 148, 136, 0.20)',
  statusOfflineBg: 'rgba(239, 68, 68, 0.08)',
  statusOfflineText: '#DC2626',
  statusOfflineBorder: 'rgba(239, 68, 68, 0.20)',
  warningBg: 'rgba(245, 158, 11, 0.08)',
  warningText: '#D97706',
  warningBorder: 'rgba(245, 158, 11, 0.20)',
  infoBg: 'rgba(59, 130, 246, 0.08)',
  infoText: '#2563EB',
  infoBorder: 'rgba(59, 130, 246, 0.20)',
  dangerBg: 'rgba(239, 68, 68, 0.08)',
  dangerText: '#DC2626',
  dangerBorder: 'rgba(239, 68, 68, 0.20)',
  shadowColor: 'rgba(15, 23, 42, 0.04)',
  phoneOuterBg: '#F1F5F9',
  phoneShellBorder: '#E2E8F0',
  phoneGlow: 'rgba(13, 148, 136, 0.15)',
};

export const darkTheme: ThemeColors = {
  background: '#0B1120', // Obsidiana azulada sobria
  surface: '#131D31',
  surfaceSecondary: '#0F172A',
  border: '#1E293B',
  borderStrong: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0B1120',
  primary: '#2DD4BF', // Menta quirúrgico luminoso pero no saturado
  primaryLight: 'rgba(45, 212, 191, 0.12)',
  primaryBorder: 'rgba(45, 212, 191, 0.25)',
  card: '#131D31',
  cardBorder: '#1E293B',
  cardHeader: '#131D31',
  inputBackground: '#0B1120',
  inputBorder: '#1E293B',
  inputPlaceholder: '#64748B',
  inputText: '#F8FAFC',
  headerBackground: '#0B1120',
  headerBorder: '#1E293B',
  modalOverlay: 'rgba(0, 0, 0, 0.75)',
  modalContainer: '#131D31',
  modalBorder: '#1E293B',
  statusOnlineBg: 'rgba(45, 212, 191, 0.12)',
  statusOnlineText: '#2DD4BF',
  statusOnlineBorder: 'rgba(45, 212, 191, 0.25)',
  statusOfflineBg: 'rgba(248, 113, 113, 0.12)',
  statusOfflineText: '#F87171',
  statusOfflineBorder: 'rgba(248, 113, 113, 0.25)',
  warningBg: 'rgba(251, 191, 36, 0.12)',
  warningText: '#FBBF24',
  warningBorder: 'rgba(251, 191, 36, 0.25)',
  infoBg: 'rgba(96, 165, 250, 0.12)',
  infoText: '#60A5FA',
  infoBorder: 'rgba(96, 165, 250, 0.25)',
  dangerBg: 'rgba(248, 113, 113, 0.12)',
  dangerText: '#F87171',
  dangerBorder: 'rgba(248, 113, 113, 0.25)',
  shadowColor: 'rgba(0, 0, 0, 0.25)',
  phoneOuterBg: '#050914',
  phoneShellBorder: '#1E293B',
  phoneGlow: 'rgba(45, 212, 191, 0.12)',
};
