import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iehbiknpvozoxqqazlfo.supabase.co'
const supabaseKey = 'sb_publishable_25_4DdSZGeQ7rvwkhBfgyQ_cx0DtnrC'

export const supabase = createClient(supabaseUrl, supabaseKey)