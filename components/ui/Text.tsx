import { Text as RNText, TextProps as RNTextProps } from 'react-native';

type Variant = 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';

interface TextProps extends RNTextProps {
  variant?: Variant;
  muted?: boolean;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  hero: 'text-3xl font-bold text-white',
  title: 'text-2xl font-semibold text-white',
  subtitle: 'text-lg font-medium text-white',
  body: 'text-base text-white',
  caption: 'text-sm text-charcoal-300',
  label: 'text-xs font-semibold uppercase tracking-wider text-charcoal-400',
};

export function Text({ variant = 'body', muted, className = '', ...props }: TextProps) {
  const colorClass = muted ? 'text-charcoal-400' : '';
  return (
    <RNText
      className={`${variantClasses[variant]} ${colorClass} ${className}`}
      accessibilityRole={variant === 'label' ? 'header' : undefined}
      {...props}
    />
  );
}
