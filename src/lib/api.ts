import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

// ---- Mock Data ----
const MOCK_PROFILE = {
  id: "mock-user-id",
  full_name: "Mock Candidate",
  persona: "Software Engineer",
  streak_days: 12,
  total_sessions: 4,
  average_score: 91,
  skill_map: { "Algorithms": 9, "System Design": 8, "Communication": 10 }
};

const MOCK_SESSIONS = [
  { id: "mock-session-1", created_at: new Date().toISOString(), company_focus: "Google", role_focus: "Frontend Engineer", duration_seconds: 1800, score: 92, status: "completed" },
  { id: "mock-session-2", created_at: new Date(Date.now() - 86400000).toISOString(), company_focus: "Meta", role_focus: "Full Stack Engineer", duration_seconds: 2400, score: 88, status: "completed" }
];

// ---- User Profiles ----
export const getUserProfile = async (userId: string) => {
  return MOCK_PROFILE;
};

export const updateUserProfile = async (userId: string, updates: any) => {
  return { ...MOCK_PROFILE, ...updates };
};

// ---- Interview Sessions ----
export const getInterviewSessions = async (userId: string) => {
  return MOCK_SESSIONS;
};

export const createInterviewSession = async (
  userId: string,
  companyFocus: string,
  roleFocus: string,
) => {
  return { id: "new-mock-session", user_id: userId, company_focus: companyFocus, role_focus: roleFocus, status: "in_progress", created_at: new Date().toISOString() };
};

export const endInterviewSession = async (
  sessionId: string,
  score: number,
  duration: number,
  feedback: string,
) => {
  return { id: sessionId, status: "completed", score, duration_seconds: duration, overall_feedback: feedback };
};

// ---- QA Logs ----
export const getSessionQALogs = async (sessionId: string) => {
  return [];
};

export const addQALog = async (logData: any) => {
  return { ...logData, id: "mock-log-" + Date.now() };
};

// ---- Long Term Memory ----
export const getUserMemories = async (userId: string) => {
  return [];
};
