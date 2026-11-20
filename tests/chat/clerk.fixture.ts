// Only the isolated chat test Vite config aliases Clerk to this module.
// Production always uses the real Clerk provider and backend authentication.
const identity = () => new URLSearchParams(location.search).get('user') ?? 'chat-test-owner';
const getToken = async () => identity();
export const useAuth = () => ({
  isLoaded: true,
  isSignedIn: true,
  userId: identity(),
  getToken,
});
