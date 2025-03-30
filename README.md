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

- `DATABASE_URL`: The connection string for PostgreSQL database.
- `JWT_SECRET`: A secure random string used to sign and verify JSON Web Tokens (JWTs). This should be a long, random string and should be kept secret. Used for user authentication and session management. Use the different version for local and prod environment.


## Seeding the Database

To populate your development database with sample users and events:


```
npm run seed
```

This command will create:

🧑‍💼 One Organizer user

🧑 One Attendee user

🧑‍🔧 One Staff user

Three sample events owned by the Organizer

✅ Test Users
Role	Email	Password
Organizer	organizer@example.com	test1234
Attendee	attendee@example.com	test1234
Staff	staff@example.com	test1234

## Using Prisma Studio

use Prisma Studio to visually browse and edit local database:
```
npx prisma studio
```
This opens a web UI at http://localhost:5555, you can:

View all tables: Users, Events, Tickets, Check-ins, Discounts

Edit or add data for testing

Explore relationships across tables


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
   - `POST /api/register`
     ```json
     // Request
     {
       "email": "string",
       "password": "string",
       "role": "Organizer" | "Staff" | "Attendee"
     }
     
     // Response
     {
       "id": "string",
       "email": "string",
       "role": "string",
       "createdAt": "string (ISO date)",
       "updatedAt": "string (ISO date)"
     }
     ```
   - `POST /api/login`
     ```json
     // Request
     {
       "email": "string",
       "password": "string"
     }
     
     // Response
     {
       "token": "string (JWT)",
       "user": {
         "id": "string",
         "email": "string",
         "role": "string"
       }
     }
     ```
   - `GET /api/user`
     ```json
     // Response
     {
       "id": "string",
       "email": "string",
       "role": "string",
       "createdAt": "string (ISO date)",
       "updatedAt": "string (ISO date)"
     }
     ```

2. **Event Management**
   - `POST /api/events`
     ```json
     // Request
     {
       "name": "string",
       "description": "string",
       "capacity": "number",
       "location": "string",
       "startTime": "string (ISO date)",
       "endTime": "string (ISO date)"
     }
     
     // Response
     {
       "id": "string",
       "organizerId": "string",
       "name": "string",
       "description": "string",
       "capacity": "number",
       "location": "string",
       "startTime": "string (ISO date)",
       "endTime": "string (ISO date)",
       "createdAt": "string (ISO date)",
       "updatedAt": "string (ISO date)"
     }
     ```
   - `GET /api/events`
     ```json
     // Response
     {
       "events": [
         {
           "id": "string",
           "organizerId": "string",
           "name": "string",
           "description": "string",
           "capacity": "number",
           "location": "string",
           "startTime": "string (ISO date)",
           "endTime": "string (ISO date)",
           "createdAt": "string (ISO date)",
           "updatedAt": "string (ISO date)"
         }
       ],
       "total": "number",
       "page": "number",
       "limit": "number"
     }
     ```
   - `GET /api/events/:id`
     ```json
     // Response
     {
       "id": "string",
       "organizerId": "string",
       "name": "string",
       "description": "string",
       "capacity": "number",
       "location": "string",
       "startTime": "string (ISO date)",
       "endTime": "string (ISO date)",
       "createdAt": "string (ISO date)",
       "updatedAt": "string (ISO date)"
     }
     ```
   - `PUT /api/events/:id`
     ```json
     // Request
     {
       "name": "string",
       "description": "string",
       "capacity": "number",
       "location": "string",
       "startTime": "string (ISO date)",
       "endTime": "string (ISO date)"
     }
     
     // Response
     {
       "id": "string",
       "organizerId": "string",
       "name": "string",
       "description": "string",
       "capacity": "number",
       "location": "string",
       "startTime": "string (ISO date)",
       "endTime": "string (ISO date)",
       "createdAt": "string (ISO date)",
       "updatedAt": "string (ISO date)"
     }
     ```
   - `DELETE /api/events/:id`
     ```json
     // Response
     {
       "success": "boolean",
       "message": "string"
     }
     ```

3. **Ticket Management**
   - `POST /api/tickets`
     ```json
     // Request
     {
       "eventId": "string",
       "tier": "General" | "VIP",
       "discountCode": "string (optional)"
     }
     
     // Response
     {
       "id": "string",
       "userId": "string",
       "eventId": "string",
       "price": "number",
       "tier": "string",
       "qrCodeData": "string",
       "discountCodeId": "string (optional)",
       "createdAt": "string (ISO date)",
       "updatedAt": "string (ISO date)"
     }
     ```
   - `GET /api/tickets`
     ```json
     // Response
     {
       "tickets": [
         {
           "id": "string",
           "userId": "string",
           "eventId": "string",
           "price": "number",
           "tier": "string",
           "qrCodeData": "string",
           "discountCodeId": "string (optional)",
           "createdAt": "string (ISO date)",
           "updatedAt": "string (ISO date)"
         }
       ],
       "total": "number",
       "page": "number",
       "limit": "number"
     }
     ```
   - `GET /api/tickets/:id`
     ```json
     // Response
     {
       "id": "string",
       "userId": "string",
       "eventId": "string",
       "price": "number",
       "tier": "string",
       "qrCodeData": "string",
       "discountCodeId": "string (optional)",
       "createdAt": "string (ISO date)",
       "updatedAt": "string (ISO date)"
     }
     ```

4. **Check-in Management**
   - `POST /api/checkin`
     ```json
     // Request
     {
       "qrCodeData": "string"
     }
     
     // Response
     {
       "success": "boolean",
       "message": "string",
       "checkIn": {
         "id": "string",
         "ticketId": "string",
         "status": "Checked In",
         "timestamp": "string (ISO date)"
       }
     }
     ```
   - `GET /api/checkin/status`
     ```json
     // Query Parameters
     {
       "eventId": "string"
     }
     
     // Response
     {
       "eventId": "string",
       "totalTickets": "number",
       "checkedIn": "number",
       "remaining": "number",
       "checkIns": [
         {
           "id": "string",
           "ticketId": "string",
           "status": "string",
           "timestamp": "string (ISO date)"
         }
       ]
     }
     ```

5. **Discount Management**
   - `POST /api/discounts`
     ```json
     // Request
     {
       "code": "string",
       "type": "Percentage" | "Fixed Amount",
       "value": "number"
     }
     
     // Response
     {
       "id": "string",
       "code": "string",
       "type": "string",
       "value": "number",
       "timesUsed": "number",
       "createdAt": "string (ISO date)",
       "updatedAt": "string (ISO date)"
     }
     ```
   - `GET /api/discounts`
     ```json
     // Response
     {
       "discounts": [
         {
           "id": "string",
           "code": "string",
           "type": "string",
           "value": "number",
           "timesUsed": "number",
           "createdAt": "string (ISO date)",
           "updatedAt": "string (ISO date)"
         }
       ],
       "total": "number",
       "page": "number",
       "limit": "number"
     }
     ```
   - `GET /api/discounts/:id`
     ```json
     // Response
     {
       "id": "string",
       "code": "string",
       "type": "string",
       "value": "number",
       "timesUsed": "number",
       "createdAt": "string (ISO date)",
       "updatedAt": "string (ISO date)"
     }
     ``` 