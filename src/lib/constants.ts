import type { GuideType } from "./types";

export const GUIDE_TYPES: Record<GuideType, { label: string; plural: string; blurb: string }> = {
  mentor: {
    label: "Mentor",
    plural: "Mentors",
    blurb: "Career and industry guidance from people a few steps ahead of you.",
  },
  counsellor: {
    label: "Counsellor",
    plural: "Counsellors",
    blurb: "Career, academic, financial and wellbeing support from qualified counsellors.",
  },
  tutor: {
    label: "Tutor",
    plural: "Tutors",
    blurb: "WAEC, NECO, JAMB, university courses and practical skills, one subject at a time.",
  },
};

export const INDUSTRIES = [
  "Technology",
  "Finance & Banking",
  "Healthcare",
  "Law",
  "Engineering",
  "Energy",
  "Education",
  "Agriculture",
  "Media & Creative",
  "Entrepreneurship",
  "Public Service",
  "Other",
];

export const STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River",
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna",
  "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "Outside Nigeria",
];

export const LANGUAGES = ["English", "Yoruba", "Igbo", "Hausa", "Pidgin", "French"];

export const MODES = ["Online", "In person"];

export const SUGGESTED_INTERESTS = [
  "Career switching", "CV review", "Interviews", "Leadership", "Software engineering", "Data analysis",
  "UI/UX design", "Product management", "Investment banking", "ICAN & ACCA", "Personal finance",
  "Medical school", "Residency abroad", "Research", "Law school", "Fundraising", "Business plans",
  "Agribusiness", "Scholarships", "Study abroad", "University choices", "Exam anxiety", "Stress & burnout",
  "WAEC Mathematics", "JAMB preparation", "Physics", "Chemistry", "Use of English", "IELTS", "Python", "SQL",
];

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const TIME_OPTIONS = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
