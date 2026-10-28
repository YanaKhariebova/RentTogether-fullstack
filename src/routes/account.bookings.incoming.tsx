import { createFileRoute } from '@tanstack/react-router';
import { FeaturePlaceholder } from '../pages/FeaturePlaceholder';
export const Route = createFileRoute('/account/bookings/incoming')({
  component: () => <FeaturePlaceholder title="Eingehende Anfragen" />,
});
