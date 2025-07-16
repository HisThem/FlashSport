export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'flashsport-secret-key-2024',
  expiresIn: '24h',
};

export const corsConfig = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
};