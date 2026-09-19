import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ybjegpaagazhcqxxnpab.supabase.co';
const supabaseAnonKey = 'sb_publishable_fLdUcE3xcnZi6AANqynpYg_HEjhhjW-';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
