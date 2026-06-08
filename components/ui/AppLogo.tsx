import { Image, type ImageProps } from 'react-native';
import { APP_LOGO, APP_NAME } from '@/constants/branding';

const SIZES = {
  sm: { width: 96, height: 96 },
  md: { width: 180, height: 180 },
  lg: { width: 248, height: 248 },
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
    typeof size === 'number' ? { width: size, height: size } : SIZES[size];

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
