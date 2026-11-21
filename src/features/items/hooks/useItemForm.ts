import { translate as t } from '../../../i18n/config';
import { useState } from 'react';
import { useItemImages } from './useItemImages';
import { initialItemFormValues, itemFormSchema } from '../model/itemFormSchema';
import type { ItemFormValues, ValidatedItemForm } from '../model/itemFormSchema';

type FormFields = Omit<ItemFormValues, 'images'>;
type FormErrors = Partial<Record<keyof ItemFormValues, string>>;

export function useItemForm(
  onValidSubmit: (values: ValidatedItemForm) => void | Promise<void>,
  initialValues: ItemFormValues = initialItemFormValues,
) {
  const [values, setValues] = useState<FormFields>(() => ({
    title: initialValues.title,
    description: initialValues.description,
    city: initialValues.city,
    categoryId: initialValues.categoryId,
    pricePerDay: initialValues.pricePerDay,
  }));
  const gallery = useItemImages(initialValues.images.filter((image) => image.kind === 'stored'));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function clearError(field: keyof ItemFormValues) {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  }

  function changeField(field: keyof FormFields, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    clearError(field);
  }

  async function submit() {
    if (isSubmitting) return;
    const result = itemFormSchema.safeParse({
      ...values,
      images: gallery.images.map((entry) => entry.image),
    });
    setSubmitAttempts((count) => count + 1);
    if (!result.success) {
      const nextErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ItemFormValues;
        if (field && !nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onValidSubmit(result.data);
    } catch {
      setSubmitError(t('Die Anzeige konnte nicht gespeichert werden. Bitte versuche es erneut.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    values,
    errors,
    submitAttempts,
    isSubmitting,
    submitError,
    changeField,
    setServerErrors(nextErrors: FormErrors) {
      setErrors(nextErrors);
      setSubmitAttempts((count) => count + 1);
    },
    submit,
    images: gallery.images,
    imageErrors: gallery.errors,
    addFiles(files: File[]) {
      gallery.addFiles(files);
      clearError('images');
    },
    removeImage(id: string) {
      gallery.removeImage(id);
      clearError('images');
    },
    reorderImage: gallery.reorderImage,
  };
}
