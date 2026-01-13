// About Page API Response Interface

export interface AboutBannerSection {
  small_title: string | null;
  title: string | null;
  text: string | null;
  main_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  page_schema: string | null;
  page_name: string;
}

export interface AboutVision {
  text: string;
}

export interface AboutMission {
  text: string;
}

export interface AboutMessage {
  text: string;
}

export interface AboutWhy {
  text: string;
}

export interface AboutResponse {
  bannerSection: AboutBannerSection;
  visions: AboutVision;
  misssions: AboutMission;
  messages: AboutMessage;
  why: AboutWhy;
}
