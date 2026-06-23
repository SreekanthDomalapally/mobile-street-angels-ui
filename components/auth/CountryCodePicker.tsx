import { Text } from '@/components/ui/Text';
import { Pressable, ScrollView, View } from 'react-native';
import { useState } from 'react';

export interface CountryOption {
  code: string;
  dial: string;
  label: string;
  flag: string;
}

export const DEFAULT_COUNTRIES: CountryOption[] = [
  { code: 'IE', dial: '+353', label: 'Ireland', flag: '🇮🇪' },
  { code: 'GB', dial: '+44', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', dial: '+1', label: 'United States', flag: '🇺🇸' },
  { code: 'IN', dial: '+91', label: 'India', flag: '🇮🇳' },
  { code: 'AU', dial: '+61', label: 'Australia', flag: '🇦🇺' },
  { code: 'CA', dial: '+1', label: 'Canada', flag: '🇨🇦' },
  { code: 'DE', dial: '+49', label: 'Germany', flag: '🇩🇪' },
  { code: 'FR', dial: '+33', label: 'France', flag: '🇫🇷' },
];

interface CountryCodePickerProps {
  value: CountryOption;
  onChange: (country: CountryOption) => void;
}

export function CountryCodePicker({ value, onChange }: CountryCodePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center rounded-xl border border-charcoal-700 bg-charcoal-900 px-4 py-4"
        accessibilityRole="button"
        accessibilityLabel={`Country code ${value.label}`}>
        <Text variant="body" className="mr-2 text-xl">
          {value.flag}
        </Text>
        <Text variant="body" className="text-white">
          {value.dial}
        </Text>
        <Text variant="caption" muted className="ml-2 flex-1">
          {value.label}
        </Text>
        <Text variant="caption" muted>
          {open ? '▲' : '▼'}
        </Text>
      </Pressable>

      {open && (
        <ScrollView
          className="mt-2 max-h-48 rounded-xl border border-charcoal-700 bg-charcoal-900"
          keyboardShouldPersistTaps="handled">
          {DEFAULT_COUNTRIES.map((country) => (
            <Pressable
              key={country.code}
              onPress={() => {
                onChange(country);
                setOpen(false);
              }}
              className="flex-row items-center px-4 py-3"
              accessibilityRole="button">
              <Text variant="body" className="mr-2 text-xl">
                {country.flag}
              </Text>
              <Text variant="body" className="flex-1 text-white">
                {country.label}
              </Text>
              <Text variant="caption" muted>
                {country.dial}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export function buildE164FromParts(dial: string, localNumber: string): string {
  const digits = localNumber.replace(/\D/g, '');
  const dialDigits = dial.replace(/\D/g, '');
  if (!digits) return '';
  return `+${dialDigits}${digits}`;
}
