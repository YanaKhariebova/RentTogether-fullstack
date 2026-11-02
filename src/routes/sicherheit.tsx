import { createFileRoute } from '@tanstack/react-router';
import { InformationPage } from '../pages/InformationPage';
export const Route = createFileRoute('/sicherheit')({
  component: () => <InformationPage kind="safety" />,
});
