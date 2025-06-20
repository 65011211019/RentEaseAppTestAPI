import dotenv from 'dotenv';
dotenv.config();

const serverConfig = {
    PORT: process.env.PORT || 3000,
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    NODE_ENV: process.env.NODE_ENV || 'development',
};

export default serverConfig; 