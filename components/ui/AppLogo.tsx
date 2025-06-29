// components/ui/AppLogo.tsx
import { Image, ImageStyle, StyleSheet } from 'react-native';

interface AppLogoProps {
  width?: number;
  height?: number;
  style?: ImageStyle;
  marginBottom?: number;
}

export function AppLogo({ width = 120, height = 36, style, marginBottom = 30 }: AppLogoProps) {
  return (
    <Image
      source={require('@/assets/images/bon-appetit-logo.svg')}
      style={[styles.logo, { width, height, marginBottom }, style]}
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
