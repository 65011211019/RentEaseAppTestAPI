import dotenv from 'dotenv';
dotenv.config();

const emailConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    from: process.env.SMTP_FROM || 'noreply@rentease.com'
};

// Validate configuration
const missingFields = [];
if (!emailConfig.host) missingFields.push('SMTP_HOST');
if (!emailConfig.port) missingFields.push('SMTP_PORT');
if (!emailConfig.auth.user) missingFields.push('SMTP_USER');
if (!emailConfig.auth.pass) missingFields.push('SMTP_PASS');

if (missingFields.length > 0) {
    console.error("FATAL ERROR: SMTP configuration is incomplete. Missing fields:", missingFields);
    console.error("Please check your .env file and ensure all required SMTP settings are configured.");
    process.exit(1);
}

export default emailConfig; 