import { Text } from '@/components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, TextInput, type TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, secureTextEntry, ...props }: InputProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View className="mb-4">
      {label && (
        <Text variant="label" className="mb-2">
          {label}
        </Text>
      )}
      <View className="relative">
        <TextInput
          className={`min-h-[52px] rounded-2xl border border-glass-border bg-charcoal-800 px-4 text-base text-white ${isPassword ? 'pr-12' : ''} ${className ?? ''}`}
          placeholderTextColor="#6d6d75"
          secureTextEntry={isPassword && !passwordVisible}
          {...props}
        />
        {isPassword && (
          <Pressable
            className="absolute bottom-0 right-3 top-0 justify-center px-1"
            onPress={() => setPasswordVisible((visible) => !visible)}
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            hitSlop={8}>
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#9ca3af"
            />
          </Pressable>
        )}
      </View>
      {error && (
        <Text variant="caption" className="mt-2 text-emergency">
          {error}
        </Text>
      )}
    </View>
  );
}
