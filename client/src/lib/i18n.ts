import { useAuth } from './auth.js';

/**
 * Lightweight i18n for the persistent app chrome (navigation, Settings,
 * Profile, Home and Projects headings). Keys fall back to English when a
 * Filipino string is missing, so partial coverage degrades gracefully.
 */
export type Lang = 'en' | 'fil';

type Dict = Record<string, string>;

const en: Dict = {
  // Navigation
  'nav.home': 'Home',
  'nav.projects': 'Projects',
  'nav.notifications': 'Notifications',
  'nav.invitations': 'Invitations',
  'nav.profile': 'Profile',
  'nav.settings': 'Settings',
  'nav.signout': 'Sign out',

  // Common
  'common.saving': 'Saving…',
  'a11y.autosave': 'Changes on this page are saved automatically as you make them.',
  'a11y.mainnav': 'Main navigation. Use Tab to move between links.',

  // Settings — sections
  'settings.title': 'Settings',
  'settings.appearance': 'Appearance',
  'settings.appearance.hint': 'Theme, accent, and density.',
  'settings.interface': 'Interface',
  'settings.interface.hint': 'Navigation and default views.',
  'settings.accessibility': 'Accessibility',
  'settings.accessibility.hint': 'Contrast, motion, and readability.',
  'settings.privacy': 'Privacy',
  'settings.privacy.hint': 'What others can see.',
  'settings.langregion': 'Language & Region',
  'settings.langregion.hint': 'Localization preferences.',

  // Settings — appearance
  'settings.theme': 'Theme',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.theme.system': 'System',
  'settings.darktone': 'Dark theme tone',
  'settings.darktone.appliesInDark': 'Applies in dark mode',
  'settings.accent': 'Accent color',
  'settings.density': 'Density',
  'settings.density.comfortable': 'Comfortable',
  'settings.density.compact': 'Compact',
  'settings.fontscale': 'Font scale',

  // Settings — interface
  'settings.sidebar': 'Sidebar',
  'settings.sidebar.expanded': 'Expanded',
  'settings.sidebar.collapsed': 'Collapsed',
  'settings.defaultpage': 'Default project page',
  'settings.defaultpage.overview': 'Overview',
  'settings.defaultpage.breakdown': 'Breakdown',
  'settings.tabledensity': 'Table density',

  // Settings — accessibility
  'settings.highcontrast': 'High contrast',
  'settings.reducedmotion': 'Reduced motion',
  'settings.srhints': 'Screen-reader hints',

  // Settings — privacy
  'settings.visibility': 'Profile visibility',
  'settings.visibility.members': 'Project members',
  'settings.visibility.private': 'Private',
  'settings.visibility.public': 'Public',
  'settings.showonline': 'Show online status',
  'settings.showlastactive': 'Show last active',

  // Settings — language & region
  'settings.language': 'Language',
  'settings.language.en': 'English',
  'settings.language.fil': 'Filipino',
  'settings.region': 'Region',
  'settings.region.ph': 'Philippines',
  'settings.region.us': 'United States',

  // Profile
  'profile.title': 'Profile',
  'profile.uploadphoto': 'Upload photo',
  'profile.remove': 'Remove',
  'profile.changephoto': 'Change photo',
  'profile.userid': 'User ID',
  'profile.permanent': 'permanent',
  'profile.joined': 'Joined',
  'profile.displayname': 'Display name',
  'profile.save': 'Save changes',
  'profile.saved': 'Profile saved.',
  'profile.morecustomization': 'More customization',
  'profile.morecustomization.hint': 'Theme, accent, density, accessibility, privacy, and language live in Settings.',
  'profile.opensettings': 'Open Settings',
  'profile.preview.title': 'How others see you',
  'profile.preview.visibleto': 'Visible to',
  'profile.preview.online': 'Online now',
  'profile.preview.onlinehidden': 'Online status hidden',
  'profile.preview.lastactive': 'Last active shown',
  'profile.preview.lastactivehidden': 'Last active hidden',
  'profile.preview.privatenote': 'Your profile is private — only you can see it.',

  // Projects
  'projects.title': 'My Projects',
  'projects.subtitle': 'View and manage your construction projects.',
  'projects.new': '+ New Project',
};

const fil: Dict = {
  // Navigation
  'nav.home': 'Home',
  'nav.projects': 'Mga Proyekto',
  'nav.notifications': 'Mga Abiso',
  'nav.invitations': 'Mga Imbitasyon',
  'nav.profile': 'Profile',
  'nav.settings': 'Mga Setting',
  'nav.signout': 'Mag-sign out',

  // Common
  'common.saving': 'Sine-save…',
  'a11y.autosave': 'Awtomatikong nase-save ang mga pagbabago sa pahinang ito habang ginagawa mo.',
  'a11y.mainnav': 'Pangunahing nabigasyon. Gamitin ang Tab para lumipat sa mga link.',

  // Settings — sections
  'settings.title': 'Mga Setting',
  'settings.appearance': 'Anyo',
  'settings.appearance.hint': 'Tema, accent, at density.',
  'settings.interface': 'Interface',
  'settings.interface.hint': 'Nabigasyon at mga default na view.',
  'settings.accessibility': 'Accessibility',
  'settings.accessibility.hint': 'Contrast, galaw, at pagkabasa.',
  'settings.privacy': 'Privacy',
  'settings.privacy.hint': 'Kung ano ang nakikita ng iba.',
  'settings.langregion': 'Wika at Rehiyon',
  'settings.langregion.hint': 'Mga kagustuhan sa lokalisasyon.',

  // Settings — appearance
  'settings.theme': 'Tema',
  'settings.theme.light': 'Maliwanag',
  'settings.theme.dark': 'Madilim',
  'settings.theme.system': 'System',
  'settings.darktone': 'Tono ng madilim na tema',
  'settings.darktone.appliesInDark': 'Gumagana sa dark mode',
  'settings.accent': 'Kulay ng accent',
  'settings.density': 'Density',
  'settings.density.comfortable': 'Maluwag',
  'settings.density.compact': 'Masikip',
  'settings.fontscale': 'Laki ng font',

  // Settings — interface
  'settings.sidebar': 'Sidebar',
  'settings.sidebar.expanded': 'Nakabukas',
  'settings.sidebar.collapsed': 'Nakatiklop',
  'settings.defaultpage': 'Default na pahina ng proyekto',
  'settings.defaultpage.overview': 'Overview',
  'settings.defaultpage.breakdown': 'Breakdown',
  'settings.tabledensity': 'Density ng talahanayan',

  // Settings — accessibility
  'settings.highcontrast': 'Mataas na contrast',
  'settings.reducedmotion': 'Bawas na galaw',
  'settings.srhints': 'Mga hint para sa screen reader',

  // Settings — privacy
  'settings.visibility': 'Visibility ng profile',
  'settings.visibility.members': 'Mga miyembro ng proyekto',
  'settings.visibility.private': 'Pribado',
  'settings.visibility.public': 'Pampubliko',
  'settings.showonline': 'Ipakita ang online status',
  'settings.showlastactive': 'Ipakita ang huling aktibo',

  // Settings — language & region
  'settings.language': 'Wika',
  'settings.language.en': 'Ingles',
  'settings.language.fil': 'Filipino',
  'settings.region': 'Rehiyon',
  'settings.region.ph': 'Pilipinas',
  'settings.region.us': 'Estados Unidos',

  // Profile
  'profile.title': 'Profile',
  'profile.uploadphoto': 'Mag-upload ng litrato',
  'profile.remove': 'Alisin',
  'profile.changephoto': 'Palitan ang litrato',
  'profile.userid': 'User ID',
  'profile.permanent': 'permanente',
  'profile.joined': 'Sumali',
  'profile.displayname': 'Pangalang ipapakita',
  'profile.save': 'I-save ang mga pagbabago',
  'profile.saved': 'Na-save ang profile.',
  'profile.morecustomization': 'Higit pang customization',
  'profile.morecustomization.hint': 'Ang tema, accent, density, accessibility, privacy, at wika ay nasa Settings.',
  'profile.opensettings': 'Buksan ang Settings',
  'profile.preview.title': 'Kung paano ka nakikita ng iba',
  'profile.preview.visibleto': 'Nakikita ng',
  'profile.preview.online': 'Online ngayon',
  'profile.preview.onlinehidden': 'Nakatago ang online status',
  'profile.preview.lastactive': 'Ipinapakita ang huling aktibo',
  'profile.preview.lastactivehidden': 'Nakatago ang huling aktibo',
  'profile.preview.privatenote': 'Pribado ang iyong profile — ikaw lang ang nakakakita nito.',

  // Projects
  'projects.title': 'Mga Proyekto Ko',
  'projects.subtitle': 'Tingnan at pamahalaan ang iyong mga proyekto sa konstruksyon.',
  'projects.new': '+ Bagong Proyekto',
};

const DICTS: Record<Lang, Dict> = { en, fil };

export function translate(lang: Lang, key: string): string {
  return DICTS[lang]?.[key] ?? en[key] ?? key;
}

/** Hook: returns a `t(key)` bound to the user's current language setting. */
export function useT(): (key: string) => string {
  const { settings } = useAuth();
  const lang: Lang = settings?.language === 'fil' ? 'fil' : 'en';
  return (key: string) => translate(lang, key);
}
