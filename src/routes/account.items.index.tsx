import { createFileRoute } from '@tanstack/react-router';
import { FeaturePlaceholder } from '../pages/FeaturePlaceholder';
export const Route = createFileRoute('/account/items/')({
  component: () => <FeaturePlaceholder title="Meine Anzeigen" />,
});
