import { createFileRoute } from '@tanstack/react-router';
import { FeaturePlaceholder } from '../pages/FeaturePlaceholder';
export const Route = createFileRoute('/account/bookings/my-rentals')({
  component: () => <FeaturePlaceholder title="Meine Mieten" />,
});
