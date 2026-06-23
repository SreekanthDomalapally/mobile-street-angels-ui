import { Pressable, TextInput, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { Text } from '@/components/ui/Text';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  return (
    <View className="relative">
      <View className="flex-row justify-between gap-2">
        {digits.map((digit, index) => (
          <View
            key={index}
            className={`h-14 flex-1 items-center justify-center rounded-xl border ${
              digit.trim() ? 'border-responder-light bg-charcoal-900' : 'border-charcoal-700 bg-charcoal-900/60'
            }`}>
            <Text variant="title" className="text-white">
              {digit.trim() || '·'}
            </Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        editable={!disabled}
        caretHidden
        className="absolute inset-0 opacity-0"
        accessibilityLabel="Verification code"
      />
      <Pressable
        className="absolute inset-0"
        onPress={() => inputRef.current?.focus()}
        accessibilityRole="button"
        accessibilityLabel="Focus verification code input"
      />
    </View>
  );
}
