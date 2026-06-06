import { Text } from '@/components/ui/Text';
import { TextInput, type TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text variant="label" className="mb-2">
          {label}
        </Text>
      )}
      <TextInput
        className={`min-h-[52px] rounded-2xl border border-glass-border bg-charcoal-800 px-4 text-base text-white ${className ?? ''}`}
        placeholderTextColor="#6d6d75"
        {...props}
      />
      {error && (
        <Text variant="caption" className="mt-2 text-emergency">
          {error}
        </Text>
      )}
    </View>
  );
}
