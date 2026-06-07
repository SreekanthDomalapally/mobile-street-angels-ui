import { ContactPickerSheet } from '@/components/contacts/ContactPickerSheet';

interface AddContactModalProps {
  visible: boolean;
  groupId: string;
  groupName: string;
  existingMemberIds: string[];
  existingEmails: string[];
  onClose: () => void;
  onUpdated: () => void;
}

/** @deprecated Use ContactPickerSheet directly. Kept for group detail entry point. */
export function AddContactModal({
  visible,
  groupId,
  onClose,
  onUpdated,
}: AddContactModalProps) {
  return (
    <ContactPickerSheet
      visible={visible}
      preselectedGroupIds={[groupId]}
      onClose={onClose}
      onUpdated={onUpdated}
    />
  );
}
