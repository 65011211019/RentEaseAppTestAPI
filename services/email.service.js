import nodemailer from 'nodemailer';
import emailConfig from '../config/email.config.js';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

// Validate email configuration
if (!emailConfig.host || !emailConfig.port || !emailConfig.auth.user || !emailConfig.auth.pass) {
    const missingFields = [];
    if (!emailConfig.host) missingFields.push('SMTP_HOST');
    if (!emailConfig.port) missingFields.push('SMTP_PORT');
    if (!emailConfig.auth.user) missingFields.push('SMTP_USER');
    if (!emailConfig.auth.pass) missingFields.push('SMTP_PASS');
    
    console.error('SMTP Configuration Error: Missing required fields:', missingFields);
    throw new Error(`SMTP configuration is incomplete. Missing: ${missingFields.join(', ')}`);
}

const transporter = nodemailer.createTransport(emailConfig);

const EmailService = {
    async sendOtpEmail(email, otp) {
        const mailOptions = {
            from: emailConfig.from,
            to: email,
            subject: 'RentEase - รหัส OTP สำหรับรีเซ็ตรหัสผ่าน',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">รีเซ็ตรหัสผ่าน RentEase</h2>
                    <p>สวัสดีครับ/ค่ะ</p>
                    <p>คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชี RentEase ของคุณ</p>
                    <p>รหัส OTP ของคุณคือ:</p>
                    <h1 style="color: #007bff; font-size: 32px; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 5px;">${otp}</h1>
                    <p>รหัสนี้จะหมดอายุใน 5 นาที</p>
                    <p>หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาละเลยอีเมลนี้</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">อีเมลนี้ถูกส่งโดยระบบ RentEase</p>
                </div>
            `
        };

        try {
            // Verify SMTP connection
            console.log('Verifying SMTP connection...');
            await transporter.verify();
            console.log('SMTP connection verified successfully');
            
            // Send email
            console.log('Sending email to:', email);
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
            return true;
        } catch (error) {
            console.error('Error sending email:', {
                message: error.message,
                code: error.code,
                command: error.command,
                responseCode: error.responseCode,
                response: error.response,
                stack: error.stack
            });
            throw new ApiError(
                httpStatusCodes.INTERNAL_SERVER_ERROR,
                `Failed to send email: ${error.message}`
            );
        }
    }
};

export default EmailService; 