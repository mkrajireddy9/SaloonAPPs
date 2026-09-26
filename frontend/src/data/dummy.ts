import type { Report } from '../types';

export const demoGuests = [
  { name: 'Ananya Rao', time: '10:30 AM', service: 'Signature cut', stylist: 'Meera Nair', state: 'Ready' },
  { name: 'Rohan Mehta', time: '11:15 AM', service: 'Texture refresh', stylist: 'Arjun S.', state: 'Waiting' },
  { name: 'Divya Krishnan', time: '12:00 PM', service: 'Colour consultation', stylist: 'Nidhi Rao', state: 'In progress' },
  { name: 'Kavya Iyer', time: '01:30 PM', service: 'First visit', stylist: 'Meera Nair', state: 'Ready' },
];

export const passportStyles = [
  { name: 'Soft textured lob', meta: 'Saved today · 92 match', tone: 'blush' },
  { name: 'Air-dried movement', meta: 'Saved 14 May · daily style', tone: 'sage' },
  { name: 'Warm espresso gloss', meta: 'Saved 22 Feb · colour note', tone: 'butter' },
];

export const dummyReport: Report = {
  faceShape: 'Soft oval', texture: 'Wavy', length: 'Shoulder length', density: 'Medium-full', movement: 'Natural wave',
  signals: [
    { label: 'Dryness at ends', level: 'Mild', note: 'A nourishing finish may help the shape sit better.' },
    { label: 'Humidity sensitivity', level: 'Noticeable', note: 'Suggest a light anti-frizz routine for Bengaluru weather.' },
    { label: 'Scalp visibility', level: 'Balanced', note: 'No unusual visual signal in this estimate.' },
  ],
  recommendations: [
    { name: 'Soft textured lob', score: 92, tag: 'Best match', description: 'Keeps the shoulder-grazing ease while letting natural wave do a little work.', chips: ['Low effort', 'Movement'] },
    { name: 'Airy collarbone layers', score: 87, tag: 'Close match', description: 'A little more shape through the ends, with a soft frame around the face.', chips: ['Face framing', 'Versatile'] },
    { name: 'Long side-swept fringe', score: 76, tag: 'Try if curious', description: 'A gentle change without committing to a shorter overall length.', chips: ['Fresh feel', 'Grow-out friendly'] },
  ],
};
