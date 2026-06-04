import { Image, type ImageProps } from 'react-native';
import { APP_LOGO, APP_NAME } from '@/constants/branding';

const SIZES = {
  sm: 44,
  md: 120,
  lg: 200,
} as const;

type LogoSize = keyof typeof SIZES;

type AppLogoProps = Omit<ImageProps, 'source'> & {
  size?: LogoSize | number;
};

export function AppLogo({
  size = 'md',
  accessibilityLabel = APP_NAME,
  resizeMode = 'contain',
  style,
  ...props
}: AppLogoProps) {
  const dimension = typeof size === 'number' ? size : SIZES[size];

  return (
    <Image
      source={APP_LOGO}
      accessibilityLabel={accessibilityLabel}
      accessible
      resizeMode={resizeMode}
      style={[{ width: dimension, height: dimension }, style]}
      {...props}
    />
  );
}
