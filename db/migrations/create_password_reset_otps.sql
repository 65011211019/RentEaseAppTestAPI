-- Create password_reset_otps table
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_user_id ON password_reset_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON password_reset_otps(expires_at);

-- Add RLS policies
ALTER TABLE password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Allow system to manage OTPs
CREATE POLICY "System can manage OTPs"
    ON password_reset_otps
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow users to view their own OTPs
CREATE POLICY "Users can view their own OTPs"
    ON password_reset_otps
    FOR SELECT
    TO authenticated
    USING (auth.uid()::text = user_id::text); 