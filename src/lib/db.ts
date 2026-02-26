import { supabase } from './supabase';
import type { InterviewQuestion, AnswerScore } from './groq';

export interface Interview {
    id: string;
    user_id: string;
    job_role: string;
    company?: string;
    jd_text: string;
    resume_text: string;
    questions: InterviewQuestion[];
    created_at: string;
}

export interface Session {
    id: string;
    user_id: string;
    interview_id?: string;
    job_role: string;
    company?: string;
    score: number;
    tags: string[];
    answers: { question: string; answer: string; score: number; feedback: string; idealAnswer: string }[];
    feedback: { summary: string; topStrengths: string[]; topImprovements: string[] };
    created_at: string;
}

export async function saveInterview(data: {
    user_id: string;
    job_role: string;
    company?: string;
    jd_text: string;
    resume_text: string;
    questions: InterviewQuestion[];
}): Promise<string> {
    const { data: row, error } = await supabase.from('interviews').insert(data).select('id').single();
    if (error) throw error;
    return row.id as string;
}

export async function getInterview(id: string): Promise<Interview | null> {
    const { data, error } = await supabase.from('interviews').select('*').eq('id', id).single();
    if (error) return null;
    return data as Interview;
}

export async function getSessions(userId: string): Promise<Session[]> {
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) return [];
    return (data ?? []) as Session[];
}

export async function getSession(id: string): Promise<Session | null> {
    const { data, error } = await supabase.from('sessions').select('*').eq('id', id).single();
    if (error) return null;
    return data as Session;
}

export async function saveSession(data: {
    user_id: string;
    interview_id: string;
    job_role: string;
    company?: string;
    score: number;
    tags: string[];
    answers: { question: string; answer: string; score: number; feedback: string; idealAnswer: string }[];
    feedback: { summary: string; topStrengths: string[]; topImprovements: string[] };
}): Promise<string> {
    const { data: row, error } = await supabase.from('sessions').insert(data).select('id').single();
    if (error) throw error;
    return row.id as string;
}

export interface UserStats {
    totalSessions: number;
    avgScore: number;
    streak: number;
    skillsImproved: number;
}

export async function getUserStats(userId: string): Promise<UserStats> {
    const sessions = await getSessions(userId);
    if (sessions.length === 0) return { totalSessions: 0, avgScore: 0, streak: 0, skillsImproved: 0 };

    const avgScore = Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length);

    // Calculate streak (consecutive days)
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daySet = new Set(sessions.map(s => new Date(s.created_at).toDateString()));
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (daySet.has(d.toDateString())) streak++;
        else if (i > 0) break;
    }

    // Unique roles practiced = skills improved proxy
    const uniqueRoles = new Set(sessions.map(s => s.job_role)).size;

    return { totalSessions: sessions.length, avgScore, streak, skillsImproved: uniqueRoles };
}
