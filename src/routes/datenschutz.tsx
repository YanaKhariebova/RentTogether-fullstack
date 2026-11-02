import { createFileRoute } from '@tanstack/react-router';
import { InformationPage } from '../pages/InformationPage';
export const Route = createFileRoute('/datenschutz')({
  component: () => <InformationPage kind="privacy" />,
});
