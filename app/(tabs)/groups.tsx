import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { GroupCard } from "@/components/groups/GroupCard";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useCreateGroup, useGroups } from "@/hooks/useGroups";
import { temporaryGroupExpiryIso } from "@/lib/utils";
import { ApiError } from "@/services/api/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Href, router } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

const groupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type GroupForm = z.infer<typeof groupSchema>;

export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const { data: groups, isLoading, isError, refetch } = useGroups();
  const createGroupMutation = useCreateGroup();
  const [modalVisible, setModalVisible] = useState(false);
  const [isTemporary, setIsTemporary] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!modalVisible) {
      return;
    }

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [modalVisible]);

  const closeModal = () => {
    Keyboard.dismiss();
    setKeyboardHeight(0);
    setModalVisible(false);
    setFormError(null);
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: "" },
  });

  const onCreate = async (data: GroupForm) => {
    setFormError(null);
    try {
      await createGroupMutation.mutateAsync({
        name: data.name,
        isTemporary,
        expiresAt: isTemporary ? temporaryGroupExpiryIso() : undefined,
      });
      reset();
      setIsTemporary(false);
      setModalVisible(false);
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Could not create group. Please try again."
      );
    }
  };

  return (
    <View className="flex-1 bg-charcoal-950">
      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Text variant="title">Groups</Text>
        <Button
          title="+ New"
          size="sm"
          variant="secondary"
          onPress={() => setModalVisible(true)}
        />
      </View>

      {isLoading && <LoadingState message="Loading groups…" />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && (
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 100,
            paddingTop: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {groups?.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No groups yet"
              description="Create a trusted circle before sending SOS alerts."
              action={
                <Button
                  title="Create group"
                  onPress={() => setModalVisible(true)}
                />
              }
            />
          ) : (
            groups?.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onPress={() => router.push(`/group/${group.id}` as Href)}
              />
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable className="flex-1 justify-end bg-black/70" onPress={closeModal}>
            <Pressable
              className="rounded-t-3xl bg-charcoal-900 px-6 pt-6"
              style={{
                paddingBottom:
                  keyboardHeight > 0 ? keyboardHeight + 16 : insets.bottom + 24,
              }}
              onPress={(e) => e.stopPropagation()}>
              <Text variant="title" className="mb-6">
                New group
              </Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="mb-2 min-h-[52px] rounded-2xl border border-glass-border bg-charcoal-800 px-4 text-base text-white"
                    placeholder="Group name"
                    placeholderTextColor="#6d6d75"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoFocus
                    accessibilityLabel="Group name"
                  />
                )}
              />
              {errors.name && (
                <Text variant="caption" className="mb-4 text-emergency">
                  {errors.name.message}
                </Text>
              )}
              {formError && (
                <Text variant="caption" className="mb-4 text-emergency">
                  {formError}
                </Text>
              )}
              <Pressable
                onPress={() => setIsTemporary(!isTemporary)}
                className="mb-6 flex-row items-center gap-3 py-2"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isTemporary }}
              >
                <View
                  className={`h-6 w-6 rounded-md border ${isTemporary ? "border-responder bg-responder" : "border-charcoal-500"}`}
                />
                <Text variant="body">Temporary group (expires in 1 hour)</Text>
              </Pressable>
              <Button
                title="Create"
                loading={createGroupMutation.isPending}
                onPress={handleSubmit(onCreate)}
              />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
