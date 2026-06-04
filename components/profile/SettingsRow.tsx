import { Pressable, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { colors } from '@/constants/theme';

interface SettingsRowProps {
  label: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
}

export function SettingsRow({
  label,
  description,
  icon,
  value,
  onToggle,
  onPress,
  showChevron,
  destructive,
}: SettingsRowProps) {
  const content = (
    <View className="flex-row items-center gap-4 py-4">
      {icon && (
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-charcoal-800">
          <Ionicons name={icon} size={20} color={destructive ? colors.emergency : colors.textMuted} />
        </View>
      )}
      <View className="flex-1">
        <Text variant="body" className={destructive ? 'text-emergency' : ''}>
          {label}
        </Text>
        {description && (
          <Text variant="caption" muted>
            {description}
          </Text>
        )}
      </View>
      {onToggle != null && value != null && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: colors.surfaceElevated, true: colors.responder }}
          thumbColor="#fff"
          accessibilityLabel={label}
        />
      )}
      {showChevron && <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
        {content}
      </Pressable>
    );
  }

  return content;
}
