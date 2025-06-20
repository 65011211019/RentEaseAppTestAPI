import dotenv from 'dotenv';
dotenv.config();

const jwtConfig = {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
};

if (!jwtConfig.secret) {
    console.error("FATAL ERROR: JWT Secret is not defined. Check your .env file.");
    process.exit(1);
}

export default jwtConfig; 