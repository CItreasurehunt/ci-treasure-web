export const VENUE_VISIBILITY_OPTIONS = ["public", "hidden"] as const;

export type AdminVenueFormData = {
  id: string | null;
  name: string;
  slug: string;
  city: string;
  country: string;
  region: string;
  address: string;
  lat: string;
  lng: string;
  description: string;
  website: string;
  email: string;
  newsletter: string;
  facebook: string;
  instagram: string;
  youtube: string;
  imageUrl: string;
  imageCredit: string;
  visibility: string;
  showInList: boolean;
  showInAnnounce: boolean;
  announceName: string;
  adminNotes: string;
};

export function createEmptyVenueFormData(): AdminVenueFormData {
  return {
    id: null,
    name: "",
    slug: "",
    city: "",
    country: "",
    region: "",
    address: "",
    lat: "",
    lng: "",
    description: "",
    website: "",
    email: "",
    newsletter: "",
    facebook: "",
    instagram: "",
    youtube: "",
    imageUrl: "",
    imageCredit: "",
    visibility: "hidden",
    showInList: false,
    showInAnnounce: false,
    announceName: "",
    adminNotes: "",
  };
}
