import { createFileRoute } from '@tanstack/react-router';
import { InformationPage } from '../pages/InformationPage';
export const Route = createFileRoute('/so-funktionierts')({
  component: () => <InformationPage kind="how" />,
});
