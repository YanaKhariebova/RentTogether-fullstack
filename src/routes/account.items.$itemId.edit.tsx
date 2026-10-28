import { createFileRoute } from '@tanstack/react-router';
import { FeaturePlaceholder } from '../pages/FeaturePlaceholder';
export const Route = createFileRoute('/account/items/$itemId/edit')({
  component: () => <FeaturePlaceholder title="Anzeige bearbeiten" />,
});
