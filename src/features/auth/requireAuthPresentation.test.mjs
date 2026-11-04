import assert from 'node:assert/strict';
import test from 'node:test';
import { getSignInRequiredContent } from './requireAuthPresentation.ts';

test('each protected section gets its own sign-in icon and message', () => {
  assert.equal(getSignInRequiredContent('/account/favorites').icon, 'heart');
  assert.equal(getSignInRequiredContent('/account/messages').icon, 'chat');
  assert.equal(getSignInRequiredContent('/account/bookings/incoming').icon, 'calendar');
  assert.equal(
    getSignInRequiredContent('/account/profile').title,
    'Melde dich an, um weiterzumachen',
  );
});
