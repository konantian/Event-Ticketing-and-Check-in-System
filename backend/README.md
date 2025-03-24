# Event Ticketing Backend

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Set up the database using Prisma:
   ```
   npx prisma migrate dev --name init
   ```

3. Start the server:
   ```
   npm start
   ```

## Environment Variables

- `PORT`: The port on which the server runs.
- `DATABASE_URL`: The connection string for your PostgreSQL database.
- `JWT_SECRET`: The secret key for signing JWTs. 