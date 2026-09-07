export type Role = "client" | "pro" | "admin";

export type User = {
  id: string;
  role: Role;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string;
  createdAt: string;
  suspended: boolean;
};

export type Address = {
  id: string;
  userId: string;
  label: string;
  line: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  isDefault: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  indicativePrice: number;
  active: boolean;
};

export type ProDocument = {
  id: string;
  type: "identite" | "entreprise" | "assurance" | "certification";
  name: string;
  status: "pending" | "approved" | "rejected";
};

export type ScheduleDay = {
  day: number;
  start: string;
  end: string;
  available: boolean;
  breakStart?: string | null;
  breakEnd?: string | null;
};

export type AbsenceReason = "conges" | "maladie" | "formation" | "pause" | "autre";

export type ProAbsence = {
  id: string;
  startAt: string;
  endAt: string;
  reason: AbsenceReason;
  note?: string;
};

/** Commercial subscription: free Pro or paid Prime */
export type SubscriptionTier = "pro" | "prime";
/** Loyalty / performance badge */
export type LoyaltyBadge = "none" | "gold" | "elite";
/** Effective commercial tier used for matching & commission */
export type EffectiveTier = "pro" | "prime" | "elite";

export type TeamMember = {
  id: string;
  name: string;
  phone: string;
  role: "owner" | "intervenant";
  active: boolean;
};

export type ProProfile = {
  id: string;
  userId: string;
  company: string;
  siret: string;
  description: string;
  experienceYears: number;
  radiusKm: number;
  lat: number;
  lng: number;
  city: string;
  online: boolean;
  verified: boolean;
  status: "pending" | "verified" | "rejected" | "suspended";
  startingPrice: number;
  categoryIds: string[];
  photos: string[];
  certifications: string[];
  documents: ProDocument[];
  schedule: ScheduleDay[];
  absences: ProAbsence[];
  bufferMinutes: number;
  leadTimeHours: number;
  maxMissionsPerDay: number;
  rating: number;
  reviewCount: number;
  missionCount: number;
  acceptanceRate: number;
  /** @deprecated migrated → primeUntil */
  premiumUntil: string | null;
  /** @deprecated migrated → subscriptionTier */
  premiumPlan: "none" | "monthly" | "yearly";
  subscriptionTier: SubscriptionTier;
  primeUntil: string | null;
  primePlan: "none" | "monthly" | "yearly";
  boostUntil: string | null;
  loyaltyPoints: number;
  loyaltyBadge: LoyaltyBadge;
  businessEnabled: boolean;
  team: TeamMember[];
};

export type MissionStatus =
  | "searching"
  | "offered"
  | "accepted"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "unmatched"
  | "disputed";

export type TimelineEvent = { status: string; at: string; label: string };

export type Mission = {
  id: string;
  type: "now" | "scheduled" | "urgence";
  clientId: string;
  proId: string | null;
  categoryId: string;
  status: MissionStatus;
  address: string;
  city: string;
  lat: number;
  lng: number;
  description: string;
  photos: string[];
  scheduledAt: string | null;
  price: number;
  supplement: number;
  pendingSupplement: number | null;
  pendingSupplementReason: string | null;
  commissionRate: number;
  createdAt: string;
  timeline: TimelineEvent[];
  candidateProIds: string[];
  declinedProIds: string[];
  offerProId: string | null;
  offerExpiresAt: string | null;
  etaMinutes: number | null;
  startProLat: number | null;
  startProLng: number | null;
  paymentStatus: "none" | "pending" | "paid" | "refunded";
  paymentMethod: string | null;
  assigneeMemberId: string | null;
  quoteId: string | null;
  invoiceId: string | null;
};

export type QuoteLine = { label: string; amount: number };

export type Quote = {
  id: string;
  missionId: string;
  proId: string;
  clientId: string;
  lines: QuoteLine[];
  total: number;
  status: "draft" | "sent" | "signed" | "rejected";
  note?: string;
  createdAt: string;
  sentAt: string | null;
  signedAt: string | null;
};

export type Invoice = {
  id: string;
  number: string;
  missionId: string;
  quoteId: string | null;
  proId: string;
  clientId: string;
  total: number;
  commission: number;
  proAmount: number;
  createdAt: string;
};

export type Message = {
  id: string;
  missionId: string;
  senderId: string;
  text: string;
  photo?: string;
  createdAt: string;
};

export type Review = {
  id: string;
  missionId: string;
  clientId: string;
  proId: string;
  rating: number;
  comment: string;
  photos: string[];
  createdAt: string;
};

export type Payment = {
  id: string;
  missionId: string;
  amount: number;
  commission: number;
  proAmount: number;
  status: "pending" | "paid" | "refunded" | "upcoming";
  method: string;
  createdAt: string;
  paidAt: string | null;
};

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  href?: string;
  createdAt: string;
};

export type Favorite = { clientId: string; proId: string };

export type Dispute = {
  id: string;
  missionId: string;
  openedBy: string;
  reason: string;
  status: "open" | "resolved";
  createdAt: string;
};

export type Settings = {
  commissionRate: number;
  offerSeconds: number;
  premiumMonthlyPrice: number;
  premiumYearlyPrice: number;
  premiumExclusiveSeconds: number;
  premiumOfferBonusSeconds: number;
  primeMonthlyPrice: number;
  primeYearlyPrice: number;
  eliteExclusiveSeconds: number;
  primeExclusiveSeconds: number;
  boost24hPrice: number;
  boost7dPrice: number;
  urgenceCommissionBonus: number;
  urgencePriceMultiplier: number;
  commissionPrime: number;
  commissionElite: number;
};

export type DB = {
  users: User[];
  addresses: Address[];
  categories: Category[];
  pros: ProProfile[];
  missions: Mission[];
  messages: Message[];
  reviews: Review[];
  payments: Payment[];
  notifications: AppNotification[];
  favorites: Favorite[];
  disputes: Dispute[];
  quotes: Quote[];
  invoices: Invoice[];
  settings: Settings;
};

export type PublicUser = Omit<User, "passwordHash">;
