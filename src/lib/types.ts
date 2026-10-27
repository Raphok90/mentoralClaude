export type Role = "learner" | "guide" | "admin";
export type GuideType = "mentor" | "counsellor" | "tutor";
export type BookingStatus = "pending" | "accepted" | "completed" | "declined" | "cancelled";
export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  state: string | null;
  languages: string[];
  interests: string[];
  industry: string | null;
  wants: GuideType[];
  main_goal: string | null;
  onboarded: boolean;
}

export interface GuideProfile {
  user_id: string;
  type: GuideType;
  headline: string;
  bio: string;
  industry: string;
  expertise: string[];
  years_experience: number;
  languages: string[];
  modes: string[];
  state: string | null;
  session_minutes: number;
  verified: boolean;
  accepting_requests: boolean;
}

export interface DirectoryGuide {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  type: GuideType;
  headline: string;
  industry: string;
  expertise: string[];
  years_experience: number;
  languages: string[];
  modes: string[];
  state: string | null;
  session_minutes: number;
  accepting_requests: boolean;
  avg_rating: number;
  review_count: number;
  sessions_completed: number;
  created_at: string;
}

export interface Slot {
  weekday: number;
  start_time: string; // "18:00:00"
}

export interface PersonRef {
  full_name: string;
  avatar_url: string | null;
}

export interface Booking {
  id: string;
  requester_id: string;
  provider_user_id: string;
  date: string;
  start_time: string;
  mode: string;
  topic: string;
  note: string | null;
  meeting_link: string | null;
  decline_reason: string | null;
  status: BookingStatus;
  created_at: string;
  requester: PersonRef | null;
  provider: PersonRef | null;
  reviews?: { id: string }[];
}

export interface Review {
  id: string;
  guide_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  author_first_name: string;
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface Milestone {
  id: string;
  goal_id: string;
  text: string;
  done: boolean;
  position: number;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_date: string | null;
  archived: boolean;
  milestones: Milestone[];
}

export interface Application {
  id: string;
  user_id: string;
  type: GuideType;
  headline: string;
  industry: string;
  years_experience: number;
  expertise: string[];
  languages: string[];
  state: string | null;
  links: string | null;
  id_document_path: string | null;
  motivation: string | null;
  status: ApplicationStatus;
  admin_note: string | null;
  created_at: string;
}
