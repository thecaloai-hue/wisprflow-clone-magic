
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Transcriptions
CREATE TYPE public.transcription_mode AS ENUM ('default', 'email', 'message', 'note', 'code');

CREATE TABLE public.transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  polished_text TEXT,
  mode public.transcription_mode NOT NULL DEFAULT 'default',
  duration_seconds INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx_select_own" ON public.transcriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tx_insert_own" ON public.transcriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tx_update_own" ON public.transcriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tx_delete_own" ON public.transcriptions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_tx_user_created ON public.transcriptions(user_id, created_at DESC);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
