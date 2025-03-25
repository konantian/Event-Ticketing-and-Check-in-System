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

## Database Tables

1. **User Table**
   - `id`: Primary Key
   - `email`: Unique identifier for the user
   - `password`: Hashed password
   - `role`: User role (Organizer, Staff, Attendee)
   - `createdAt`: Timestamp of user creation (Optional)
   - `updatedAt`: Timestamp of last update (Optional)

2. **Event Table**
   - `id`: Primary Key
   - `organizerId`: Foreign Key referencing User
   - `name`: Name of the event
   - `description`: Description of the event
   - `capacity`: Maximum number of attendees
   - `location`: Event location
   - `startTime`: Start time of the event
   - `endTime`: End time of the event
   - `createdAt`: Timestamp of event creation (Optional)
   - `updatedAt`: Timestamp of last update (Optional)

3. **Ticket Table**
   - `id`: Primary Key
   - `userId`: Foreign Key referencing User
   - `eventId`: Foreign Key referencing Event
   - `price`: Price of the ticket
   - `tier`: Ticket tier (General, VIP)
   - `qrCodeData`: Encrypted QR code data
   - `discountCodeId`: Foreign Key referencing Discount (Optional)
   - `createdAt`: Timestamp of ticket creation (Optional)
   - `updatedAt`: Timestamp of last update (Optional)

4. **Check-in Table**
   - `id`: Primary Key
   - `ticketId`: Foreign Key referencing Ticket
   - `status`: Check-in status (Checked In, Not Checked In)
   - `timestamp`: Timestamp of check-in

5. **Discount Table**
   - `id`: Primary Key
   - `code`: Discount code
   - `type`: Discount type (Percentage or Fixed Amount)
   - `value`: Discount value
   - `timesUsed`: Number of times the discount has been used (Optional)

## API Endpoints

1. **User Authentication**
   - `POST /api/register`: Register a new user
   - `POST /api/login`: Authenticate a user and return a JWT
   - `GET /api/user`: Get user details (requires authentication)

2. **Event Management**
   - `POST /api/events`: Create a new event (Organizer only)
   - `GET /api/events`: List all events
   - `GET /api/events/:id`: Get details of a specific event
   - `PUT /api/events/:id`: Update event details (Organizer only)
   - `DELETE /api/events/:id`: Delete an event (Organizer only)

3. **Ticket Management**
   - `POST /api/tickets`: Purchase a ticket for an event
   - `GET /api/tickets`: List all tickets for a user
   - `GET /api/tickets/:id`: Get details of a specific ticket

4. **Check-in Management** 
   - `POST /api/checkin`: Check in a user using a QR code
   - `GET /api/checkin/status`: Get check-in status for an event

5. **Discount Management**
   - `POST /api/discounts`: Create a new discount code (Organizer only)
   - `GET /api/discounts`: List all discount codes
   - `GET /api/discounts/:id`: Get details of a specific discount code 