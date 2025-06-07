// components/ui/AppLogo.tsx
import { Image, StyleSheet } from 'react-native';

export function AppLogo() {
  return (
    <Image
      source={require('@/assets/images/bon-appetit-logo.svg')}
      style={styles.logo}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 120,
    height: 36,
    alignSelf: 'center',
    marginBottom: 30,
  },
});
