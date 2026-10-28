import { createFileRoute } from '@tanstack/react-router';
import { FeaturePlaceholder } from '../pages/FeaturePlaceholder';
export const Route = createFileRoute('/catalog')({
  component: () => <FeaturePlaceholder title="Entdecken" />,
});
