# RentEase API

A robust and secure API for the RentEase platform, built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization
- Profile management
- File uploads with Supabase storage
- Password reset functionality
- Input validation
- Error handling
- Logging
- Security best practices

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Supabase account
- SMTP server for emails

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=your_mongodb_uri

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_BUCKET=your_bucket_name

# SMTP
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=your_smtp_from_email
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/rentease-api.git
cd rentease-api
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password-with-otp` - Reset password with OTP

### Users

- `POST /api/users/register` - Register new user
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/profile` - Update user profile
- `PATCH /api/users/avatar` - Update user avatar
- `POST /api/users/change-password` - Change user password

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Input validation
- CORS enabled
- Helmet security headers
- Rate limiting
- File upload validation

## Error Handling

The API uses a centralized error handling mechanism with proper HTTP status codes and error messages.

## Logging

Winston logger is used for logging with different log levels and formats.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 