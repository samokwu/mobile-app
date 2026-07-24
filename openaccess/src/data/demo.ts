// Demo data for the OpenAccess prototype. Everything here is static except
// the home coordinates, which drive the real GPS map screen — set one of
// them to a place near you (e.g. your house) to test live tracking.

export type Home = {
  id: number;
  addr: string;
  city: string;
  time: string;
  kind: 'HPM visit' | 'Vendor';
  batt: number;
  boxId: number;
  coord: { latitude: number; longitude: number };
  // AI-generated clip (scripts/generate-lockbox-video.mjs) showing where the
  // lockbox is mounted on this home, played on the En Route screen.
  lockboxVideo?: number;
};

export const HOMES: Home[] = [
  {
    id: 0,
    addr: '2847 Alder Creek Dr',
    city: 'Tempe, AZ',
    time: '2:30 PM',
    kind: 'HPM visit',
    batt: 87,
    boxId: 4820,
    coord: { latitude: 33.41477, longitude: -111.90931 },
    lockboxVideo: require('../../assets/videos/lockbox-preview.mp4'),
  },
  {
    id: 1,
    addr: '118 Sagebrush Ln',
    city: 'Mesa, AZ',
    time: '3:15 PM',
    kind: 'Vendor',
    batt: 62,
    boxId: 4821,
    coord: { latitude: 33.41512, longitude: -111.83148 },
  },
  {
    id: 2,
    addr: '9021 Mesquite Ct',
    city: 'Chandler, AZ',
    time: '4:00 PM',
    kind: 'HPM visit',
    batt: 91,
    boxId: 4822,
    coord: { latitude: 33.30616, longitude: -111.84125 },
  },
];

// Shared vendor identity — shown on the Profile screen and in the Unlock
// access log so the demo stays consistent.
export const VENDOR = {
  initials: 'JT',
  name: 'Jordan Torres',
  shortName: 'J. Torres',
  role: 'Vendor',
  company: 'Torres Home Services LLC',
  vendorId: 'VND-20847',
  accessLevel: 'Standard · lockbox access',
  phone: '(480) 555-0184',
  email: 'jordan@torreshomeservices.com',
} as const;

export const IN_RANGE_THRESHOLD_M = 2;
