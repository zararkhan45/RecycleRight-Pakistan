/**
 * RecycleRight Pakistan — Household Mock Data
 *
 * Realistic Pakistani-context placeholder data for the Household app.
 * Lahore neighborhoods (DHA Phase 5, Gulberg III, Model Town, Bahria Town,
 * Johar Town, Garden Town, Cavalry Ground, Cantt).
 *
 * Green Points are awarded for handing recyclables over to verified
 * collectors. Points-per-kg rates mirror the Household reward schedule
 * (these differ from Collector PKR earnings by design).
 */

export const householdProfile = {
  id: 'h_001',
  name: 'Fatima Malik',
  email: 'fatima.malik@gmail.com',
  phone: '0321 4567890',
  city: 'Lahore',
  address: 'House 14, Street 7, DHA Phase 5, Lahore',
  greenPoints: 1240,
  memberSince: 'March 2024',
  avatarInitials: 'FM',
  verified: true,
};

export const wasteTypes = [
  {
    id: 'plastic',
    label: 'Plastic',
    icon: '♻️',
    colour: '#3B82F6',
    pointsPerKg: 10,
  },
  {
    id: 'paper',
    label: 'Paper & Cardboard',
    icon: '📰',
    colour: '#F59E0B',
    pointsPerKg: 5,
  },
  {
    id: 'metal',
    label: 'Metal & Aluminium',
    icon: '🥫',
    colour: '#6B7280',
    pointsPerKg: 8,
  },
  {
    id: 'glass',
    label: 'Glass',
    icon: '🍾',
    colour: '#14B8A6',
    pointsPerKg: 6,
  },
  {
    id: 'organic',
    label: 'Organic',
    icon: '🍂',
    colour: '#92400E',
    pointsPerKg: 3,
  },
  {
    id: 'electronics',
    label: 'Electronics',
    icon: '🔌',
    colour: '#8B5CF6',
    pointsPerKg: 15,
  },
];

export const pickupRequests = [
  {
    id: 'pr_001',
    status: 'completed',
    wasteType: 'plastic',
    estimatedWeight: 4.5,
    scheduledDate: '2026-04-18T10:00:00+05:00',
    area: 'DHA Phase 5',
    collectorName: 'Imran Qureshi',
    collectorPhone: '0301 2345678',
    submittedAt: '2026-04-17T19:42:00+05:00',
    completedAt: '2026-04-18T10:34:00+05:00',
    pointsEarned: 45,
    receiptId: 'RCP-2026-04-018A',
  },
  {
    id: 'pr_002',
    status: 'completed',
    wasteType: 'paper',
    estimatedWeight: 8.0,
    scheduledDate: '2026-04-12T14:30:00+05:00',
    area: 'Gulberg III',
    collectorName: 'Hamza Sheikh',
    collectorPhone: '0333 9876543',
    submittedAt: '2026-04-11T22:10:00+05:00',
    completedAt: '2026-04-12T14:55:00+05:00',
    pointsEarned: 40,
    receiptId: 'RCP-2026-04-012B',
  },
  {
    id: 'pr_003',
    status: 'completed',
    wasteType: 'metal',
    estimatedWeight: 2.2,
    scheduledDate: '2026-04-05T09:15:00+05:00',
    area: 'Model Town',
    collectorName: 'Bilal Ahmed',
    collectorPhone: '0345 1122334',
    submittedAt: '2026-04-04T18:05:00+05:00',
    completedAt: '2026-04-05T09:48:00+05:00',
    pointsEarned: 18,
    receiptId: 'RCP-2026-04-005C',
  },
  {
    id: 'pr_004',
    status: 'en_route',
    wasteType: 'glass',
    estimatedWeight: 3.0,
    scheduledDate: '2026-04-25T16:00:00+05:00',
    area: 'DHA Phase 5',
    collectorName: 'Usman Tariq',
    collectorPhone: '0312 7654321',
    submittedAt: '2026-04-25T13:20:00+05:00',
    completedAt: null,
    pointsEarned: null,
    receiptId: null,
  },
  {
    id: 'pr_005',
    status: 'accepted',
    wasteType: 'plastic',
    estimatedWeight: 6.5,
    scheduledDate: '2026-04-26T11:00:00+05:00',
    area: 'Bahria Town',
    collectorName: 'Ali Raza',
    collectorPhone: '0322 3344556',
    submittedAt: '2026-04-24T20:48:00+05:00',
    completedAt: null,
    pointsEarned: null,
    receiptId: null,
  },
  {
    id: 'pr_006',
    status: 'pending',
    wasteType: 'electronics',
    estimatedWeight: 1.8,
    scheduledDate: '2026-04-27T13:00:00+05:00',
    area: 'Johar Town',
    collectorName: null,
    collectorPhone: null,
    submittedAt: '2026-04-25T08:55:00+05:00',
    completedAt: null,
    pointsEarned: null,
    receiptId: null,
  },
  {
    id: 'pr_007',
    status: 'pending',
    wasteType: 'paper',
    estimatedWeight: 5.0,
    scheduledDate: '2026-04-28T10:30:00+05:00',
    area: 'Garden Town',
    collectorName: null,
    collectorPhone: null,
    submittedAt: '2026-04-25T09:30:00+05:00',
    completedAt: null,
    pointsEarned: null,
    receiptId: null,
  },
  {
    id: 'pr_008',
    status: 'cancelled',
    wasteType: 'organic',
    estimatedWeight: 7.5,
    scheduledDate: '2026-04-15T08:00:00+05:00',
    area: 'Cavalry Ground',
    collectorName: 'Ahsan Iqbal',
    collectorPhone: '0300 5566778',
    submittedAt: '2026-04-14T17:25:00+05:00',
    completedAt: null,
    pointsEarned: null,
    receiptId: null,
  },
];

export const recentActivity = [
  {
    id: 'act_001',
    type: 'pickup',
    description: 'Pickup completed by Imran Qureshi — 4.5 kg plastic from DHA Phase 5',
    timestamp: '2026-04-18T10:34:00+05:00',
    pointsDelta: 45,
  },
  {
    id: 'act_002',
    type: 'points_credited',
    description: '40 Green Points credited for paper pickup (Gulberg III)',
    timestamp: '2026-04-12T15:02:00+05:00',
    pointsDelta: 40,
  },
  {
    id: 'act_003',
    type: 'pickup',
    description: 'Pickup completed by Bilal Ahmed — 2.2 kg metal from Model Town',
    timestamp: '2026-04-05T09:48:00+05:00',
    pointsDelta: 18,
  },
  {
    id: 'act_004',
    type: 'request_submitted',
    description: 'New pickup request submitted — 1.8 kg electronics, Johar Town',
    timestamp: '2026-04-25T08:55:00+05:00',
    pointsDelta: 0,
  },
  {
    id: 'act_005',
    type: 'request_submitted',
    description: 'New pickup request submitted — 5.0 kg paper, Garden Town',
    timestamp: '2026-04-25T09:30:00+05:00',
    pointsDelta: 0,
  },
];

export const greenPointsTiers = [
  {
    id: 'bronze',
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 499,
    perksDescription:
      'Welcome tier. Earn points on every pickup and unlock Silver at 500 pts.',
  },
  {
    id: 'silver',
    name: 'Silver',
    minPoints: 500,
    maxPoints: 999,
    perksDescription:
      '5% bonus points on plastic pickups, priority scheduling on weekends, and free monthly bin liners.',
  },
  {
    id: 'gold',
    name: 'Gold',
    minPoints: 1000,
    maxPoints: 2499,
    perksDescription:
      '10% bonus points on all pickups, same-day pickup eligibility, and quarterly Daraz vouchers (PKR 500).',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    minPoints: 2500,
    maxPoints: Infinity,
    perksDescription:
      '20% bonus points, dedicated collector matching, free e-waste pickups, and PKR 2,000 monthly Foodpanda vouchers.',
  },
];

export const collectorOnRoute = {
  name: 'Usman Tariq',
  phone: '0312 7654321',
  currentLat: 31.4716,
  currentLng: 74.4008,
  eta: '~6 min',
  vehicleType: 'Motorcycle',
  licensePlate: 'LEB-4471',
  rating: 4.7,
};
