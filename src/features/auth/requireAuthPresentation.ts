export type SignInRequiredContent = {
  icon: 'heart' | 'chat' | 'calendar';
  title: string;
  description: string;
};

export function getSignInRequiredContent(pathname: string): SignInRequiredContent {
  if (pathname.startsWith('/account/favorites')) {
    return {
      icon: 'heart',
      title: 'Deine Favoriten warten auf dich',
      description: 'Melde dich an, um deine gespeicherten Dinge wiederzufinden.',
    };
  }
  if (pathname.startsWith('/account/messages')) {
    return {
      icon: 'chat',
      title: 'Bleib mit deiner Nachbarschaft in Kontakt',
      description: 'Melde dich an, um Nachrichten zu Anfragen und Ausleihen zu sehen.',
    };
  }
  if (pathname.startsWith('/account/bookings')) {
    return {
      icon: 'calendar',
      title: 'Deine Anfragen warten auf dich',
      description: 'Melde dich an, um deine Mieten und eingehenden Anfragen zu verwalten.',
    };
  }
  return {
    icon: 'heart',
    title: 'Melde dich an, um weiterzumachen',
    description: 'Melde dich an, um deine Nachbarschaft zu entdecken.',
  };
}
