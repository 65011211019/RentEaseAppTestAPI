import { createClient } from '@supabase/supabase-js';
import dbConfig from '../config/db.config.js';

let supabase;

try {
    supabase = createClient(dbConfig.supabaseUrl, dbConfig.supabaseKey, {
        auth: {
            persistSession: false
        }
    });
    
    // Test the connection
    supabase.from('users').select('count').limit(1)
        .then(() => console.log('Successfully connected to Supabase'))
        .catch(error => console.error('Supabase connection error:', error));
} catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    process.exit(1);
}

export default supabase; 