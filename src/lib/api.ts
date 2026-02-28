import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/";

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
  const { data, error } = await supabase
    .from('users_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return MOCK_PROFILE; // Fallback to mock for now
  return data;
};

// ---- Interview Sessions ----
export const getInterviewSessions = async (userId: string) => {
  const { data, error } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return MOCK_SESSIONS;
  return data;
};

export const createInterviewSession = async (
  userId: string,
  companyFocus: string,
  roleFocus: string,
) => {
  const { data, error } = await supabase
    .from('interview_sessions')
    .insert({ user_id: userId, company_focus: companyFocus, role_focus: roleFocus, status: 'in_progress' })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const endInterviewSession = async (
  sessionId: string,
  score: number,
  duration: number,
  feedback: string,
) => {
  const { data, error } = await supabase
    .from('interview_sessions')
    .update({ status: 'completed', score, duration_seconds: duration, overall_feedback: feedback })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
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
  const { data, error } = await supabase
    .from('session_qa_logs')
    .select('current_question, constructive_feedback, created_at')
    .eq('user_id', userId)
    .not('constructive_feedback', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) return [];
  return data;
};
