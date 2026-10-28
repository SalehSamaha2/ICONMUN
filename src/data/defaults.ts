// Fallback content. The public site shows this until (and unless) the database answers,
// so the website never breaks if Supabase is down or not configured yet.

export type IconKey = 'shield' | 'eye' | 'lock' | 'activity' | 'landmark';

export interface CommitteeItem {
  id: string;
  code: string;
  name: string;
  iconKey: IconKey;
  topic: string;
  level: string;
  seats: string;
  charter: string;
  focusQuestions: string[];
  keyCountries: string[];
  backgroundGuideOverview: string;
}

export interface ScheduleEventItem {
  time: string;
  title: string;
  location: string;
  description: string;
  badge?: string;
}

export interface ScheduleGroupItem {
  id: string;
  dayNumber: number;
  dayLabel: string;
  dayTheme: string;
  events: ScheduleEventItem[];
}

export interface SecretariatItem {
  id: string;
  name: string;
  role: string;
  image?: string;
  quote: string;
  bio: string;
  isConfirmed: boolean;
  objectPosition?: string;
}

export type SiteSettings = Record<string, string>;

export type TrackKey = 'delegate' | 'volunteer' | 'security' | 'media';

/** One way of joining the conference (delegate, or one of the team roles). */
export interface TrackItem {
  key: TrackKey;
  title: string;
  description: string;
  isOpen: boolean; // master switch
  opensAt: string | null; // ISO time, optional
  closesAt: string | null; // ISO time, optional
  closedLabel: string; // what visitors see when closed, e.g. "Closed" or "Full"
}

export interface SiteContent {
  committees: CommitteeItem[];
  schedule: ScheduleGroupItem[];
  secretariat: SecretariatItem[];
  settings: SiteSettings;
  tracks: TrackItem[];
}

const TBA_CHARTER = 'Council charter and mandate to be announced by the Secretariat.';
const TBA_GUIDE =
  'The official background guide and rules of procedure are currently being prepared by the High Secretariat for ICON MUN 2027.';

const mkCommittee = (n: number, code: string, iconKey: IconKey): CommitteeItem => ({
  id: `council-${n}`,
  code,
  name: `${code} (TBA)`,
  iconKey,
  topic: 'Topic TBA — Under Secretariat Review',
  level: 'TBA',
  seats: 'Seats TBA',
  charter: TBA_CHARTER,
  focusQuestions: ['Inquiries and research directives TBA.', 'Discussion prompts TBA.'],
  keyCountries: ['Allotments TBA'],
  backgroundGuideOverview: TBA_GUIDE,
});

const ev = (title: string, location: string, description: string): ScheduleEventItem => ({
  time: 'TBA',
  title,
  location,
  description,
  badge: 'TBA',
});

const DEFAULT_SECRETARIAT: SecretariatItem[] = [
  {
    id: 'sec-1',
    name: 'Laila Mohammad',
    role: 'Secretary-General',
    image: '/assets/aistudio/WhatsApp_Image_2026-10-21_at_3.09.45_PM_b7951032.jpeg',
    quote: 'I hope we can support each other, share our ideas, and make ICON MUN 2027 a successful and unforgettable experience for everyone!! 🤍',
    bio: 'hiii everyoneeee!! my name is laila mohammad, and im the secretary-general of icon mun 2027!! im so happy to be part of this journey and to work with such an amazing team. i hope we can support each other, share our ideas, and make icon mun 2027 a successful and unforgettable experience for everyone!! 🤍',
    isConfirmed: true,
    objectPosition: 'center 85%',
  },
  {
    id: 'sec-2',
    name: 'Laya Shahwan',
    role: 'Deputy Secretary-General',
    image: '/assets/aistudio/WhatsApp_Image_2026-10-21_at_5.27.20_PM_1145c352.jpeg',
    quote: 'I’m really happy to be working with my team to create the best and memorable MUN!!',
    bio: 'hellooo everyone, my name is laya shahwan and i’m the deputy secretary-general of icon mun 2027! i’m really happy to be working with my team to create the best and memorable mun!!',
    isConfirmed: true,
    objectPosition: '50% 35%',
  },
  {
    id: 'sec-3',
    name: 'Lara Alabsi',
    role: 'Under-Secretary-General',
    image: '/assets/aistudio/WhatsApp_Image_2026-10-21_at_3.25.06_PM_bb8c5329.jpeg',
    quote: 'Excited to meet you all and make this MUN one to remember, pls don’t make me regret being nice!',
    bio: 'hiii everyone im lara, your amazing, goated USG!! if you don’t know me yet give it a week, i talk enough for that to change. excited to meet you all and make this MUN one to remember, pls don’t make me regret being nice',
    isConfirmed: true,
    objectPosition: 'center 32%',
  },
];

export const DEFAULT_CONTENT: SiteContent = {
  committees: [
    mkCommittee(1, 'Council I', 'shield'),
    mkCommittee(2, 'Council II', 'eye'),
    mkCommittee(3, 'Council III', 'lock'),
    mkCommittee(4, 'Council IV', 'activity'),
    mkCommittee(5, 'Council V', 'landmark'),
  ],
  schedule: [
    {
      id: 'day-1',
      dayNumber: 1,
      dayLabel: 'DAY 01',
      dayTheme: 'Opening & Committee Sessions · TBA',
      events: [
        ev('Check-In & Accreditation', 'Venue: TBA', 'Delegate badge and materials distribution. Timetable To Be Announced.'),
        ev('Opening Ceremony', 'Hall: TBA', 'Opening address by the High Secretariat. Timetable To Be Announced.'),
        ev('Committee Session I', 'Chambers: TBA', 'Initial roll call and debate. Timetable To Be Announced.'),
      ],
    },
    {
      id: 'day-2',
      dayNumber: 2,
      dayLabel: 'DAY 02',
      dayTheme: 'Substantive Debate & Directives · TBA',
      events: [
        ev('Committee Session II', 'Chambers: TBA', 'Working papers and moderated caucusing. Timetable To Be Announced.'),
        ev('Committee Session III', 'Chambers: TBA', 'Directives and crisis developments. Timetable To Be Announced.'),
      ],
    },
    {
      id: 'day-3',
      dayNumber: 3,
      dayLabel: 'DAY 03',
      dayTheme: 'Resolutions & Closing Ceremony · TBA',
      events: [
        ev('Committee Session IV', 'Chambers: TBA', 'Resolution amendments and voting. Timetable To Be Announced.'),
        ev('Closing Plenary & Awards', 'Hall: TBA', 'Closing address and delegate commendations. Timetable To Be Announced.'),
      ],
    },
  ],
  secretariat: DEFAULT_SECRETARIAT,
  tracks: [
    { key: 'delegate', title: 'Delegate', description: 'Represent a nation in one of the councils.', isOpen: true, opensAt: null, closesAt: null, closedLabel: 'Closed' },
    { key: 'volunteer', title: 'Volunteer', description: 'Help run the conference: registration desk, logistics and delegate care.', isOpen: false, opensAt: null, closesAt: null, closedLabel: 'Closed' },
    { key: 'security', title: 'Security', description: 'Keep the venue safe and the flow of people orderly.', isOpen: false, opensAt: null, closesAt: null, closedLabel: 'Closed' },
    { key: 'media', title: 'Media', description: 'Photography, video, design and social media coverage.', isOpen: false, opensAt: null, closesAt: null, closedLabel: 'Closed' },
  ],
  settings: {
    contact_email: '',
    contact_phone: '',
    venue: '',
    instagram_url: '',
    linkedin_url: '',
    twitter_url: '',
    telegram_url: '',
  },
};
