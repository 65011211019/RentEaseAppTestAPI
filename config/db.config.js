import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
};

if (!dbConfig.supabaseUrl || !dbConfig.supabaseKey) {
    console.error("FATAL ERROR: Supabase URL or Key is not defined. Check your .env file.");
    process.exit(1);
}

export default dbConfig; 