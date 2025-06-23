import React, { useState, useRef } from 'react';
import { View, TextInput, Pressable, StyleSheet, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Image } from 'expo-image';


export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [emailValid, setEmailValid] = useState(true);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [secureRepeat, setSecureRepeat] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const codeInputs = useRef<Array<TextInput | null>>([]);
  const validateEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

  const handleSendCode = async () => {
    if (!validateEmail(email)) {
      setEmailValid(false);
      return;
    }
    try {
      const res = await fetch('https://bon-appetit-production.up.railway.app/api/users/send-password-change-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setError('');
        setStep(2);
      } else {
        const data = await res.json();
        setError(data.error || data.message);
      }
    } catch (err) {
      setError('Error del servidor');
    }
  };

  const handleVerifyCode = async () => {
    try {
      const res = await fetch('https://bon-appetit-production.up.railway.app/api/users/verify-password-change-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verificationCode: Number(code) }),
      });
      if (res.ok) {
        setError('');
        setStep(3);
      } else {
        const data = await res.json();
        setError(data.error || 'El código ingresado no es válido');
      }
    } catch {
      setError('Error del servidor');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== repeatPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      const res = await fetch('https://bon-appetit-production.up.railway.app/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verificationCode: Number(code), newPassword }),
      });
      if (res.ok) {
        setError('');
        setSuccessMessage('Contraseña actualizada con éxito');
        setTimeout(() => router.replace('/'), 1500);
      } else {
        const data = await res.json();
        setError(data.error || data.message);
      }
    } catch {
      setError('Error del servidor');
    }
  };

  return (
  <>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrapper}>
      <ThemedView style={styles.container}>
        <Image
          source={require('@/assets/images/bon-appetit-logo.svg')}
          style={styles.logo}
          contentFit="contain"
        />

        <View style={styles.inner}>
          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>Ingresá tu mail</Text>
              <Text style={styles.stepSubtitle}>Recibiras un código para recuperar tu clave</Text>
              <TextInput
                placeholder="ejemplo@bonappetit.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9E9E9E"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (!emailValid) setEmailValid(true);
                }}
                onBlur={() => setEmailValid(validateEmail(email))}
                style={[styles.input, !emailValid && styles.inputError]}
              />
              {!emailValid && <Text style={styles.error}>Email inválido</Text>}
              <Pressable style={styles.button} onPress={handleSendCode}>
                <Text style={styles.buttonText}>Ir ></Text>
              </Pressable>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>Cambiá tu clave</Text>
              <Text style={styles.stepSubtitle}>Ingresá el código que enviamos a tu mail</Text>
              <View style={styles.codeContainer}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <TextInput
                    key={i}
                    ref={(ref) => (codeInputs.current[i] = ref)}
                    style={styles.codeInput}
                    keyboardType="numeric"
                    maxLength={1}
                    placeholderTextColor="#9E9E9E"
                    value={code[i] || ''}
                    onChangeText={(digit) => {
                      const newCode = code.split('');
                      newCode[i] = digit;
                      const finalCode = newCode.join('').slice(0, 6);
                      setCode(finalCode);
                      if (digit && i < 5) codeInputs.current[i + 1]?.focus();
                    }}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace' && !code[i] && i > 0) {
                        const newCode = code.split('');
                        newCode[i - 1] = '';
                        setCode(newCode.join(''));
                        codeInputs.current[i - 1]?.focus();
                      }
                    }}
                  />
                ))}
              </View>
              <Pressable style={styles.button} onPress={handleVerifyCode}>
                <Text style={styles.buttonText}>Ok ></Text>
              </Pressable>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.stepTitle}>Ingresá tu nueva contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Contraseña nueva"
                  secureTextEntry={secure}
                  style={styles.passwordInput}
                  value={newPassword}
                  placeholderTextColor="#9E9E9E"
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setError('');
                  }}
                />
                <Pressable onPress={() => setSecure(!secure)}>
                  <Ionicons name={secure ? 'eye-off' : 'eye'} size={20} color="#9E9E9E" />
                </Pressable>
              </View>

              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Reingresá la nueva contraseña"
                  secureTextEntry={secureRepeat}
                  style={styles.passwordInput}
                  value={repeatPassword}
                   placeholderTextColor="#9E9E9E"
                  onChangeText={(text) => {
                    setRepeatPassword(text);
                    setError('');
                  }}
                />
                <Pressable onPress={() => setSecureRepeat(!secureRepeat)}>
                  <Ionicons name={secureRepeat ? 'eye-off' : 'eye'} size={20} color="#9E9E9E" />
                </Pressable>
              </View>

              {newPassword && repeatPassword && (
                <Text style={{ color: newPassword === repeatPassword ? 'green' : 'red', marginBottom: 8 }}>
                  {newPassword === repeatPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                </Text>
              )}

              <Pressable style={styles.button} onPress={handleChangePassword}>
                <Text style={styles.buttonText}>Ir ></Text>
              </Pressable>
            </>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!successMessage && <Text style={styles.success}>{successMessage}</Text>}
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  </>
);

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  wrapper: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  inner: {
    flex: 1,
    width: '90%',
    alignSelf: 'center',
    paddingTop: 60,
  },
  logo: {
    width: 180,
    height: 62,
    alignSelf: 'center',
    marginTop: 100,
    marginBottom: 24
  },
  form: {
    width: '100%',
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
    color: '#424242',
  },
  input: {
    height: 48,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  success: {
    color: 'green',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#055B49',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
  },
  codeContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 16,
},
codeInput: {
  width: 50,
  height: 60,
  backgroundColor: '#FFF',
  borderRadius: 8,
  textAlign: 'center',
  fontSize: 24,
  color: '#212121',
  borderWidth: 1,
  borderColor: '#E0E0E0',
},
stepTitle: {
  fontSize: 20,
  fontWeight: '600',
  textAlign: 'center',
  marginBottom: 8,
  color: '#212121',
},
stepSubtitle: {
  fontSize: 14,
  textAlign: 'center',
  color: '#757575',
  marginBottom: 24,
}

});
