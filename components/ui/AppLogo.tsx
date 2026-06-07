import { Image, type ImageProps } from 'react-native';
import { APP_LOGO, APP_NAME } from '@/constants/branding';

const SIZES = {
  sm: { width: 148, height: 40 },
  md: { width: 220, height: 60 },
  lg: { width: 280, height: 76 },
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
  const dimensions =
    typeof size === 'number'
      ? { width: size * 3.7, height: size }
      : SIZES[size];

  return (
    <Image
      source={APP_LOGO}
      accessibilityLabel={accessibilityLabel}
      accessible
      resizeMode={resizeMode}
      style={[dimensions, style]}
      {...props}
    />
  );
}
