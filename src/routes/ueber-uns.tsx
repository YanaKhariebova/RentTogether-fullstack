import { createFileRoute } from '@tanstack/react-router';
import { InformationPage } from '../pages/InformationPage';
export const Route = createFileRoute('/ueber-uns')({
  component: () => <InformationPage kind="about" />,
});
