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
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',
  primary: '#059669',
  primaryLight: 'rgba(5, 150, 105, 0.1)',
  primaryBorder: 'rgba(5, 150, 105, 0.25)',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  cardHeader: '#F8FAFC',
  inputBackground: '#F8FAFC',
  inputBorder: '#CBD5E1',
  inputPlaceholder: '#94A3B8',
  inputText: '#0F172A',
  headerBackground: '#FFFFFF',
  headerBorder: '#E2E8F0',
  modalOverlay: 'rgba(15, 23, 42, 0.5)',
  modalContainer: '#FFFFFF',
  modalBorder: '#E2E8F0',
  statusOnlineBg: 'rgba(5, 150, 105, 0.1)',
  statusOnlineText: '#059669',
  statusOnlineBorder: 'rgba(5, 150, 105, 0.25)',
  statusOfflineBg: 'rgba(220, 38, 38, 0.1)',
  statusOfflineText: '#DC2626',
  statusOfflineBorder: 'rgba(220, 38, 38, 0.25)',
  warningBg: 'rgba(217, 119, 6, 0.1)',
  warningText: '#D97706',
  warningBorder: 'rgba(217, 119, 6, 0.25)',
  infoBg: 'rgba(37, 99, 235, 0.1)',
  infoText: '#2563EB',
  infoBorder: 'rgba(37, 99, 235, 0.25)',
  dangerBg: 'rgba(220, 38, 38, 0.1)',
  dangerText: '#DC2626',
  dangerBorder: 'rgba(220, 38, 38, 0.25)',
  shadowColor: 'rgba(15, 23, 42, 0.08)',
  phoneOuterBg: '#0B0F19',
  phoneShellBorder: '#CBD5E1',
  phoneGlow: 'rgba(5, 150, 105, 0.25)',
};

export const darkTheme: ThemeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#0F172A',
  border: '#334155',
  borderStrong: '#475569',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',
  primary: '#34D399',
  primaryLight: 'rgba(52, 211, 153, 0.15)',
  primaryBorder: 'rgba(52, 211, 153, 0.3)',
  card: '#1E293B',
  cardBorder: '#334155',
  cardHeader: '#1E293B',
  inputBackground: '#0F172A',
  inputBorder: '#334155',
  inputPlaceholder: '#64748B',
  inputText: '#FFFFFF',
  headerBackground: '#0F172A',
  headerBorder: '#1E293B',
  modalOverlay: 'rgba(0, 0, 0, 0.7)',
  modalContainer: '#1E293B',
  modalBorder: '#334155',
  statusOnlineBg: 'rgba(52, 211, 153, 0.15)',
  statusOnlineText: '#34D399',
  statusOnlineBorder: 'rgba(52, 211, 153, 0.3)',
  statusOfflineBg: 'rgba(248, 113, 113, 0.15)',
  statusOfflineText: '#F87171',
  statusOfflineBorder: 'rgba(248, 113, 113, 0.3)',
  warningBg: 'rgba(251, 191, 36, 0.15)',
  warningText: '#FBBF24',
  warningBorder: 'rgba(251, 191, 36, 0.3)',
  infoBg: 'rgba(59, 130, 246, 0.15)',
  infoText: '#60A5FA',
  infoBorder: 'rgba(59, 130, 246, 0.3)',
  dangerBg: 'rgba(248, 113, 113, 0.15)',
  dangerText: '#F87171',
  dangerBorder: 'rgba(248, 113, 113, 0.3)',
  shadowColor: 'rgba(0, 0, 0, 0.3)',
  phoneOuterBg: '#050811',
  phoneShellBorder: '#1E293B',
  phoneGlow: 'rgba(52, 211, 153, 0.15)',
};
