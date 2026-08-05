export type Screen =
"landing" |
"pricing" |
"partner" |
"partner-login" |
"partner-dashboard" |
"login" |
"signup" |
"onboarding" |
"password-forgot" |
"password-reset" |
"email-verification" |
"staff-invite" |
"not-found" |
"technical-error" |
"overview" |
"queues" |
"ticket" |
"services" |
"forms" |
"staff" |
"analytics" |
"history" |
"establishments" |
"team" |
"notifications" |
"support" |
"settings" |
"subscription" |
"invoices" |
"superadmin" |
"admin-plans" |
"admin-support" |
"restricted" |
"missing-slug" |
"checkin" |
"status";

export type UserRole = "superadmin" | "admin" | "staff" | "client";
export type QueueState = "waiting" | "preparing" | "called" | "serving" | "absent" | "completed";

export interface QueueEntry {
  id: string;
  ticket: string;
  name: string;
  service: string;
  waitingMinutes: number;
  people?: number;
  state: QueueState;
  joinedAt: string;
  form_data?: Record<string, string>;
}

export interface Service {
  id: string;
  name: string;
  location: string;
  averageWait: number;
  activeCount: number;
  status: "open" | "paused";
}

export interface FormField {
  id: string;
  label: string;
  type: "text" | "phone" | "select" | "textarea" | "number";
  required: boolean;
  options?: string[];
}

export interface SupportMessage {
  id: string;
  sender: "company" | "support";
  author: string;
  body: string;
  time: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: "open" | "in_progress" | "resolved";
  updatedAt: string;
  messages: SupportMessage[];
}