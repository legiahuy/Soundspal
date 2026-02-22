export interface VenueBasicUpdatePayload {
  display_name?: string
  brief_bio?: string
  business_type?: string[]
  capacity?: string
}

export interface VenueContactUpdatePayload {
  city?: string
  country?: string
  detailed_address?: string
  email?: string
  phone_number?: string
  website_url?: string
}

export interface VenueAdditionalUpdatePayload {
  convenient_facilities?: string[]
  open_hour?: string
  rent_price?: string
}
