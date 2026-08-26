import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AuthResponse, DoctorUser, LoginCredentials } from '../types';

const AUTH_TOKEN_KEY = '@medsys_mobile_token';
const AUTH_USER_KEY = '@medsys_mobile_user';

// URL del backend: puerto 4000 para backend API (localhost para iOS/Web, 10.0.2.2 para Android)
const getBaseApiUrl = (): string => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api';
  }
  return 'http://localhost:4000/api';
};

export const authService = {
  /**
   * Inicia sesión del médico contra el backend y persiste el token JWT
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const apiUrl = `${getBaseApiUrl()}/auth/login`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email.trim(),
          password: credentials.password,
        }),
      });

      const data = (await response.json()) as { message?: string; token?: string; user?: DoctorUser };

      if (!response.ok || !data.token || !data.user) {
        if (response.status === 401 || data.message === 'Invalid credentials') {
          throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');
        }
        const errorMessage = data.message || 'Credenciales inválidas. Verifica tu correo y contraseña.';
        throw new Error(errorMessage);
      }

      const authResponse: AuthResponse = {
        token: data.token,
        user: data.user,
        message: data.message,
      };

      // Guardar token y usuario en almacenamiento seguro persistente
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

      return authResponse;
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'Invalid credentials') {
          throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');
        }
        if (err.message === 'Network request failed') {
          throw new Error('Error de conexión con el servidor. Verifica tu red o servidor.');
        }
        throw err;
      }
      throw new Error('Error al conectar con el servidor. Verifica tu conexión a la red.');
    }
  },

  /**
   * Obtiene la sesión guardada localmente si existe
   */
  async getStoredSession(): Promise<{ token: string; user: DoctorUser } | null> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const userJson = await AsyncStorage.getItem(AUTH_USER_KEY);

      if (!token || !userJson) {
        return null;
      }

      const user = JSON.parse(userJson) as DoctorUser;
      return { token, user };
    } catch {
      return null;
    }
  },

  /**
   * Obtiene la empresa corporativa asignada al doctor desde el backend (o caché offline)
   */
  async getDoctorAssignedCompany(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const userJson = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (!token || !userJson) {
        return await AsyncStorage.getItem('@medsys_doctor_company');
      }

      const user = JSON.parse(userJson) as DoctorUser;
      const response = await fetch(`${getBaseApiUrl()}/doctors`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const doctors = (await response.json()) as Array<{
          user: { email: string };
          company?: { name: string } | null;
        }>;

        const myDoctor = doctors.find((d) => d.user.email === user.email);
        if (myDoctor?.company?.name) {
          await AsyncStorage.setItem('@medsys_doctor_company', myDoctor.company.name);
          return myDoctor.company.name;
        }
      }

      return await AsyncStorage.getItem('@medsys_doctor_company');
    } catch {
      return await AsyncStorage.getItem('@medsys_doctor_company');
    }
  },

  /**
   * Cierra la sesión y elimina las credenciales locales
   */
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(AUTH_USER_KEY);
      await AsyncStorage.removeItem('@medsys_doctor_company');
    } catch {
      // Ignorar errores al limpiar almacenamiento
    }
  },
};
