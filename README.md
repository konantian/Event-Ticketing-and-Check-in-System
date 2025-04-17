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

## Users

The system includes:

👨‍💼 One Organizer user
👤 One Attendee user

| Role      | Email                | Password |
|-----------|----------------------|----------|
| Organizer | organizer@example.com | test1234 |
| Attendee  | attendee@example.com  | test1234 |

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
    - `remaining`: Number of remaining tickets for the event
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

### User Authentication

#### Register a new user
`POST` `/api/register`

##### Parameters
> | name | type | data type | description |
> |------|------|-----------|-------------|
> | None | required | object (JSON) | User registration data |

##### Request Body
```json
{
  "email": "string",
  "password": "string",
  "role": "Organizer" | "Attendee"
}
```

##### Responses
> | http code | content-type | response |
> |-----------|--------------|----------|
> | `201` | `application/json` | Created user object |
> | `400` | `application/json` | `{"error":"Validation error message"}` |

##### Response Example
```json
{
  "id": "string",
  "email": "string",
  "role": "string",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

#### Login user
`POST` `/api/login`

##### Parameters
> | name | type | data type | description |
> |------|------|-----------|-------------|
> | None | required | object (JSON) | User login credentials |

##### Request Body
```json
{
  "email": "string",
  "password": "string"
}
```

##### Responses
> | http code | content-type | response |
> |-----------|--------------|----------|
> | `200` | `application/json` | JWT token and user object |
> | `401` | `application/json` | `{"error":"Invalid credentials"}` |

##### Response Example
```json
{
  "token": "string (JWT)",
  "user": {
    "id": "string",
    "email": "string",
    "role": "string"
  }
}
```

#### Get current user
`GET` `/api/user`

##### Parameters
> | name | type | data type | description |
> |------|------|-----------|-------------|
> | Authorization | header | string | JWT token |

##### Responses
> | http code | content-type | response |
> |-----------|--------------|----------|
> | `200` | `application/json` | User object |
> | `401` | `application/json` | `{"error":"Not authenticated"}` |

##### Response Example
```json
{
  "id": "string",
  "email": "string",
  "role": "string",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

### Event Management

#### Create a new event
`POST` `/api/events`

##### Parameters
> | name | type | data type | description |
> |------|------|-----------|-------------|
> | Authorization | header | string | JWT token (Organizer role required) |
> | None | required | object (JSON) | Event data |

##### Request Body
```json
{
  "name": "string",
  "description": "string",
  "capacity": "number",
  "location": "string",
  "startTime": "string (ISO date)",
  "endTime": "string (ISO date)"
}
```

##### Responses
> | http code | content-type | response |
> |-----------|--------------|----------|
> | `201` | `application/json` | Created event object |
> | `400` | `application/json` | `{"error":"Validation error message"}` |
> | `401` | `application/json` | `{"error":"Not authenticated"}` |
> | `403` | `application/json` | `{"error":"Not authorized"}` |

##### Response Example
```json
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

#### List all events
`GET` `/api/events`

##### Parameters
> | name | type | data type | description |
> |------|------|-----------|-------------|
> | page | query | number | Page number for pagination (optional) |
> | limit | query | number | Items per page (optional) |

##### Responses
> | http code | content-type | response |
> |-----------|--------------|----------|
> | `200` | `application/json` | List of events with pagination |

##### Response Example
```json
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

#### Get event by ID
`GET` `/api/events/{id}`

##### Parameters
> | name | type | data type | description |
> |------|------|-----------|-------------|
> | id | path | string | Event ID |

##### Responses
> | http code | content-type | response |
> |-----------|--------------|----------|
> | `200` | `application/json` | Event object |
> | `404` | `application/json` | `{"error":"Event not found"}` |

##### Response Example
```json
{
  "id": "string",
  "organizerId": "string",
  "name": "string",
  "description": "string",
  "capacity": "number",
  "remaining": "number",
  "location": "string",
  "startTime": "string (ISO date)",
  "endTime": "string (ISO date)",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

#### Update event by ID
`PUT` `/api/events/{id}`

##### Parameters
> | name | type | data type | description |
> |------|------|-----------|-------------|
> | id | path | string | Event ID |
> | Authorization | header | string | JWT token (Organizer role required) |
> | None | required | object (JSON) | Updated event data |

##### Request Body
```json
{
  "name": "string",
  "description": "string",
  "capacity": "number",
  "location": "string",
  "startTime": "string (ISO date)",
  "endTime": "string (ISO date)"
}
```

##### Responses
> | http code | content-type | response |
> |-----------|--------------|----------|
> | `200` | `application/json` | Updated event object |
> | `400` | `application/json` | `{"error":"Validation error message"}` |
> | `401` | `application/json` | `{"error":"Not authenticated"}` |
> | `403` | `application/json` | `{"error":"Not authorized"}` |
> | `404` | `application/json` | `{"error":"Event not found"}` |

##### Response Example
```json
{
  "id": "string",
  "organizerId": "string",
  "name": "string",
  "description": "string",
  "capacity": "number",
  "remaining": "number",
  "location": "string",
  "startTime": "string (ISO date)",
  "endTime": "string (ISO date)",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

#### Delete event by ID
`DELETE` `/api/events/{id}`

##### Parameters
> | name | type | data type | description |
> |------|------|-----------|-------------|
> | id | path | string | Event ID |
> | Authorization | header | string | JWT token (Organizer role required) |

##### Responses
> | http code | content-type | response |
> |-----------|--------------|----------|
> | `200` | `application/json` | Success message |
> | `401` | `application/json` | `{"error":"Not authenticated"}` |
> | `403` | `application/json` | `{"error":"Not authorized"}` |
> | `404` | `application/json` | `{"error":"Event not found"}` |

##### Response Example
```json
{
  "success": "boolean",
  "message": "string"
}
```

### Ticket Management

#### Create a new ticket
`POST` `/api/tickets`

##### Parameters
> | name | type | data type | description |
> |------|------|-----------|-------------|
> | Authorization | header | string | JWT token (Attendee role required) |
> | None | required | object (JSON) | Ticket data |

##### Request Body
```json
{
  "eventId": "string",
  "tier": "General" | "VIP",
  "discountCode": "string (optional)"
}
```

##### Responses
> | http code | content-type | response |
> |-----------|--------------|----------|
> | `201` | `application/json` | Created ticket object |
> | `400` | `application/json` | `{"error":"Validation error message"}` |
> | `401` | `application/json` | `{"error":"Not authenticated"}` |
> | `403` | `application/json` | `{"error":"Not authorized"}` |

##### Response Example
```json
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

#### List all tickets
`GET` `/api/tickets`

##### Parameters
> | name | type | data type | description |
> |------|------|-----------|-------------|
> | Authorization | header | string | JWT token |
> | page | query | number | Page number for pagination (optional) |
> | limit | query | number | Items per page (optional) |

##### Responses
> | http code | content-type | response |
> |-----------|--------------|----------|
> | `200` | `application/json` | List of tickets with pagination |
> | `401` | `application/json` | `{"error":"Not authenticated"}` |

##### Response Example
```json
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

#### Get ticket by ID
`GET` `/api/tickets/{id}`

##### Parameters
> | name | type | data type | description |
> |------|------|-----------|-------------|
> | id | path | string | Ticket ID |
> | Authorization | header | string | JWT token |

##### Responses
> | http code | content-type | response |
> |-----------|--------------|----------|
> | `200` | `application/json` | Ticket object |
> | `401` | `application/json` | `{"error":"Not authenticated"}` |
> | `403` | `application/json` | `{"error":"Not authorized"}` |
> | `404` | `application/json` | `{"error":"Ticket not found"}` |

##### Response Example
```json
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