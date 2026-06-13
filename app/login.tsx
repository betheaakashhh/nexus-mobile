// app/login.tsx
// Mobile login screen — calls useAuthStore.login(), which stores the
// JWT in expo-secure-store. On success, the AuthGate in _layout.tsx
// automatically redirects to /(tabs).

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius } from '@/lib/theme';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const login      = useAuthStore((s) => s.login);
  const loading    = useAuthStore((s) => s.loading);
  const error      = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  async function handleSubmit() {
    if (!email.trim() || !password) return;
    await login(email.trim().toLowerCase(), password);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.logo}>Nexus</Text>
          <Text style={styles.subtitle}>Sign in to your workspace</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(v) => { setEmail(v); if (error) clearError(); }}
              placeholder="you@example.com"
              placeholderTextColor={colors.text3}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={(v) => { setPassword(v); if (error) clearError(); }}
                placeholder="••••••••"
                placeholderTextColor={colors.text3}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, (loading || !email || !password) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !email || !password}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.buttonText}>Sign in</Text>}
          </TouchableOpacity>

          <Text style={styles.footer}>
            Your data is private — only you can see it.{'\n'}
            Same account as the Nexus web dashboard.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.bg2,
    borderRadius: radius.r,
    borderWidth: 1,
    borderColor: colors.border2,
    padding: 28,
  },
  logo: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text3,
    textAlign: 'center',
    marginBottom: 28,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    color: colors.text3,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.r2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.r2,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eyeText: {
    color: colors.text3,
    fontSize: 12,
    fontWeight: '600',
  },
  error: {
    color: colors.red,
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.r2,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    fontSize: 11,
    color: colors.text3,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});