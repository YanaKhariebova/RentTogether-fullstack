import { createFileRoute } from '@tanstack/react-router';
import { InformationPage } from '../pages/InformationPage';
export const Route = createFileRoute('/hilfe')({
  component: () => <InformationPage kind="help" />,
});
