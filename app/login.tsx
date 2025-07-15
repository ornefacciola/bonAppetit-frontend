//app/login.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AppLogo } from '@/components/ui/AppLogo';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('')
  const [emailValid, setEmailValid] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  React.useEffect(() => {
    // Al montar, buscar credenciales guardadas
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('savedCredentials');
        if (saved) {
          const { email, password } = JSON.parse(saved);
          setEmail(email);
          setPassword(password);
          setRememberMe(true);
        }
      } catch {}
    })();
  }, []);

  const validateEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

  const onSubmit = async () => {
    if (!validateEmail(email)) {
      setEmailValid(false);
      return;
    }
  
    try {
      const response = await fetch('https://bon-appetit-production.up.railway.app/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        if (rememberMe) {
          await AsyncStorage.setItem('savedCredentials', JSON.stringify({ email, password }));
        } else {
          await AsyncStorage.removeItem('savedCredentials');
        }
        await login(data.token);
        router.replace('/(tabs)/home');
      } else {
        setError(data.error || data.message || 'Login failed');
      }
    } catch (error) {
      setError('Server Error, please try again')
    }
  }

  return (
    <>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <ThemedView style={styles.container}>
        
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={28} color="#025E45" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppLogo width={180} height={62} style={{ marginBottom: -1, marginLeft: -12 }} />
        </View>
        <View style={{ width: 28 }} />
      </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.inner}
        >
        <ThemedText
          type="defaultSemiBold"
          style={[styles.label, !emailValid && styles.labelError]}
        >
          EMAIL
        </ThemedText>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, !emailValid && styles.inputError]}
            placeholder="ejemplo@bonappetit.com"
            placeholderTextColor="#9E9E9E"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={text => {
              setEmail(text)
              if (!emailValid) setEmailValid(true)
            }}
            onBlur={() => setEmailValid(validateEmail(email))}
            autoComplete="email"
            textContentType="emailAddress"
          />
          {!emailValid && (
            <ThemedText style={styles.errorMessage}>
              email is required
            </ThemedText>
          )}
        </View>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          CONTRASEÑA
        </ThemedText>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="••••••••"
            placeholderTextColor="#9E9E9E"
            secureTextEntry={secure}
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            autoComplete="password"
            textContentType="password"
          />
          <Pressable onPress={() => setSecure(!secure)}>
            <Ionicons name={secure ? 'eye-off' : 'eye'} size={24} color="#9E9E9E" />
          </Pressable>
        </View>
        {/* Checkbox recordar mis datos */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8, marginTop:-25}}>
          <Pressable
            onPress={() => setRememberMe(v => !v)}
            style={{
              width: 15, height: 15, borderWidth: 1, borderColor: '#025E45', borderRadius: 4, marginRight: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: rememberMe ? '#025E45' : '#fff'
            }}
          >
            {rememberMe && <Ionicons name="checkmark" size={10} color="#fff" />}
          </Pressable>
          <ThemedText style={{ color: '#025E45', fontWeight: 'bold', fontSize: 13 }}>Recordar mis datos</ThemedText>
        </View>
          {error && (
            <ThemedText style={styles.generalErrorMessage}>
              {error}
            </ThemedText>
          )}
          <Pressable style={styles.button} onPress={onSubmit}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>
              Ir
            </ThemedText>
          </Pressable>

          <Pressable onPress={() => router.push('/forgotPasswordScreen')}>
            <ThemedText type="link" style={styles.forgot}>
              Olvidaste tu contraseña?
            </ThemedText>
          </Pressable>

          <View style={styles.registerContainer}>
            <ThemedText type="default" style={styles.registerText}>
              Recién nos conoces?{' '}
            </ThemedText>
            <Pressable onPress={() => setShowModal(true)}>
              <ThemedText type="defaultSemiBold" style={styles.registerLink}>
                REGISTRATE
              </ThemedText>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>

      <Modal
        transparent
        visible={showModal}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
              Solicitá tu registro
            </ThemedText>
            <Pressable onPress={() => Linking.openURL('https://www.bonappetit.com/register')}>
              <ThemedText type="link" style={styles.modalLink}>
                www.bonappetit.com/register
              </ThemedText>
            </Pressable>
            <Pressable style={styles.modalButton} onPress={() => setShowModal(false)}>
              <ThemedText type="defaultSemiBold" style={styles.modalButtonText}>
                Cerrar
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 100,
    marginBottom: 24,
    width: '90%',
    alignSelf: 'center',
    //gap: 12, // si no funciona, usá marginRight manual
  },
  logoWrapper: {
    //marginLeft: 16, // empuja el logo para que no se solape con el ícono
  },
  inner: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
    paddingTop: 60,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
    color: '#424242',
  },
  labelError: {
    color: 'red',
  },
  inputContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom:20,
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  errorMessage: {
    position: 'absolute',
    bottom: 0,   
    left: 12,    
    color: 'red',
    fontSize:11,
  },
  generalErrorMessage: {
    color: 'red',
    fontSize: 11,
    marginBottom: 12,
    textAlign: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 32,
    width: '100%',
  },
  passwordInput: {
    flex: 1,
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: '#055B49',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 15
  },
  buttonText: {
    color: '#FFFFFF',
  },
  forgot: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#616161',
    fontSize: 12,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: 12,
    color: '#616161',
  },
  registerLink: {
    fontSize: 12,
    color: '#055B49',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: 'black'
  },
  modalLink: {
    fontSize: 14,
    textDecorationLine: 'underline',
    marginBottom: 24,
    color: '#025E45',
  },
  modalButton: {
    backgroundColor: '#055B49',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  suggestionsBox: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
