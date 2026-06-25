export const EVENT_TYPE_OPTIONS = [
  "jam",
  "class",
  "lab",
  "underscore",
  "cdp",
  "performance",
  "lecture",
  "workshop",
  "long_jam",
  "training",
  "festival",
  "camp",
  "retreat",
  "intensive",
  "residency",
  "other",
] as const;

export const EVENT_STATUS_OPTIONS = ["draft", "published", "archived"] as const;
export const LINK_TYPE_OPTIONS = ["registration", "website", "facebook", "instagram", "telegram", "whatsapp", "other"] as const;
export const TEACHER_ROLE_OPTIONS = ["teacher", "assistant", "guest", "musician"] as const;
export const ORGANIZER_ROLE_OPTIONS = ["lead", "co-organizer", "hosting_venue"] as const;

export type AdminPriceItem = {
  amount: string;
  currency: string;
  description: string;
};

export type AdminLinkItem = {
  type: string;
  url: string;
};

export type AdminPersonItem = {
  profileId: string;
  name: string;
  role: string;
};

export type AdminEventFormData = {
  id: string | null;
  title: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  timezone: string;
  city: string;
  country: string;
  venueName: string;
  description: string;
  imageUrl: string;
  cancelled: boolean;
  cancelledText: string;
  hide: boolean;
  priceItems: AdminPriceItem[];
  linkItems: AdminLinkItem[];
  teachers: AdminPersonItem[];
  organizers: AdminPersonItem[];
};

export function createEmptyEventFormData(): AdminEventFormData {
  return {
    id: null,
    title: "",
    type: "workshop",
    status: "draft",
    startDate: "",
    endDate: "",
    timezone: "Europe/Berlin",
    city: "",
    country: "",
    venueName: "",
    description: "",
    imageUrl: "",
    cancelled: false,
    cancelledText: "",
    hide: false,
    priceItems: [],
    linkItems: [],
    teachers: [],
    organizers: [],
  };
}
