import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://sxkegulacdjtpnifhydz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4a2VndWxhY2RqdHBuaWZoeWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2Mzg0OTksImV4cCI6MjA4NjIxNDQ5OX0.7H_KEM0bdj6j3mPbmRnM6lJxBj3eWk1ENdyQY02GN4I'
);
