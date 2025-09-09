export const env = {
  port: Number(process.env.PORT || 4000),
  // Strong default for local dev; set JWT_SECRET in env for production
  jwtSecret: process.env.JWT_SECRET || 'x0K3b!2r7Qp9@F1sZ4h8^W6mT3y#N9cG5jR2vL8kP0dS7qH4tU1bM6nY3pE9aC',
  databaseUrl: process.env.DATABASE_URL || '',
}

