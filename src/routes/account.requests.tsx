import { createFileRoute } from '@tanstack/react-router';
import { BookingNavigation } from '../features/bookings/BookingNavigation';
import { FeaturePlaceholder } from '../pages/FeaturePlaceholder';

export const Route = createFileRoute('/account/requests')({
  component: () => (
    <>
      <BookingNavigation />
      <FeaturePlaceholder title="Eingehende Anfragen" />
    </>
  ),
});
