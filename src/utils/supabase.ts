import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mxqrupcvaxtzcisgposb.supabase.co';
const supabaseKey = 'sb_publishable_aw2EhZIgskLYRnZ-kk2uHg_s5rcinc5';

export const supabase = createClient(supabaseUrl, supabaseKey);
