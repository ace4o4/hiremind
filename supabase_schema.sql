-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector
with schema extensions;

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.

--------------------------------------------------------------------------------
-- 1. users_profiles
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  current_streak integer default 0,
  total_score integer default 0,
  active_persona text default 'standard',
  skill_map jsonb default '{}'::jsonb, -- e.g., {"Problem Solving": 85, "Communication": 90}
  
  constraint users_profiles_full_name_check check (char_length(full_name) >= 2)
);

-- Enable RLS
alter table public.users_profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.users_profiles
  for select using (true);

create policy "Users can insert their own profile." on public.users_profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.users_profiles
  for update using (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users_profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

--------------------------------------------------------------------------------
-- 2. interview_sessions
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users_profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  score integer default 0,
  duration_seconds integer default 0,
  company_focus text,
  role_focus text,
  status text default 'in_progress', -- in_progress, completed, abandoned
  overall_feedback text
);

alter table public.interview_sessions enable row level security;

create policy "Users can view their own sessions." on public.interview_sessions
  for select using (auth.uid() = user_id);

create policy "Users can create their own sessions." on public.interview_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own sessions." on public.interview_sessions
  for update using (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 3. session_qa_logs
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.session_qa_logs (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.interview_sessions(id) on delete cascade not null,
  user_id uuid references public.users_profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  question_text text not null,
  user_answer_text text,
  ai_feedback_text text,
  audio_url text, -- If we store voice answers
  score_content integer default 0,
  score_delivery integer default 0,
  is_weakness boolean default false -- Flag for MemoryAgent to easily pull
);

alter table public.session_qa_logs enable row level security;

create policy "Users can view their own QA logs." on public.session_qa_logs
  for select using (auth.uid() = user_id);

create policy "Users can create their own QA logs." on public.session_qa_logs
  for insert with check (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 4. long_term_memory (Vector Store)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.long_term_memory (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users_profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  memory_type text not null, -- e.g., 'weakness', 'strength', 'behavioral_trait'
  content text not null,     -- e.g., "User struggles with explaining REST architecture scaling"
  embedding vector(1536)     -- OpenAI text-embedding-3-small uses 1536 dims
);

alter table public.long_term_memory enable row level security;

create policy "Users can view their own memory." on public.long_term_memory
  for select using (auth.uid() = user_id);

create policy "Users can create their own memory." on public.long_term_memory
  for insert with check (auth.uid() = user_id);

-- Create a function to similarity search memories
create or replace function match_memories (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    long_term_memory.id,
    long_term_memory.content,
    1 - (long_term_memory.embedding <=> query_embedding) as similarity
  from long_term_memory
  where long_term_memory.user_id = p_user_id
  and 1 - (long_term_memory.embedding <=> query_embedding) > match_threshold
  order by long_term_memory.embedding <=> query_embedding
  limit match_count;
$$;
