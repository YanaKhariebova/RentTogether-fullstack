// Only the isolated chat test Vite config aliases Clerk to this module.
// Production always uses the real Clerk provider and backend authentication.
const getToken = async () => null;
export const useAuth = () => ({
  isLoaded: true,
  isSignedIn: true,
  userId: 'chat-test-owner',
  getToken,
});
