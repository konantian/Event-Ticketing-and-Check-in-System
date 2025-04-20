
# Event Ticketing and QR Code Check-in System

**Yuan Wang**  
1002766526  
[ywang.wang@mail.utoronto.ca](mailto:ywang.wang@mail.utoronto.ca)  

**Lanhui Shi**  
1004989961  
[lanhui.shi@mail.utoronto.ca](mailto:lanhui.shi@mail.utoronto.ca)  

**Yingzhuo Sun**  
1011274425  
[yingzhuo.sun@mail.utoronto.ca](mailto:yingzhuo.sun@mail.utoronto.ca)  

**Course**: ECE1724  
**Date**: April 20, 2025  

---

## 1. Introduction

In today’s fast-paced, digital-first world, the demand for efficient, automated, and user-friendly event management platforms has grown significantly. Traditional methods of handling event logistics—such as manual registration, paper-based tickets, and spreadsheet-based attendee tracking—are no longer viable for medium–to large-scale events. Even smaller-scale gatherings increasingly require digital tools for smooth execution.

Our project, the **Event Ticketing and QR Code Check-in System**, is designed to address these growing needs. It is a full-stack web application that offers a seamless, secure, and scalable solution for event organizers and attendees. The system handles ticket generation, registration, check-in, and live analytics through modern technologies such as **Next.js**, **PostgreSQL**, and **Tailwind CSS**.

Unlike existing platforms that charge high service fees and lack real-time functionalities, our system emphasizes affordability, real-time check-in capability, and full control over the data and design. By leveraging a modular and role-based architecture, the platform distinguishes itself by offering a targeted user experience for each user type, making event management not only efficient but also intuitive and enjoyable.

---

## 2. Motivation

We were inspired to build this project by our frustrations with existing event platforms. Platforms like **Eventbrite**, **Meetup**, and **TicketTailor** offer many features, but they fall short in several critical aspects. Most of them charge high fees per ticket, have rigid UI/UX flows, provide limited control over the registration form design, and often lack live features such as real-time check-in dashboards and QR verification systems.

We envisioned a customizable, affordable, and extensible system that would cater to not only professional conference organizers but also campus clubs, community organizers, and anyone who wants to host an event with modern tools without the financial or operational burden of enterprise-grade services.

Our goals were to:

- Generate unique, fraud-resistant tickets
- Validate check-ins via QR codes in real time
- Maintain full control over data and branding
- Provide a simple and secure registration and entry process

We also wanted this project to be a learning opportunity—to build a real-world system that addresses asynchronous communication, secure authentication, performance optimization, and data integrity challenges in a full-stack environment.

---

## 3. Project Objectives

The overarching goal of this project was to create a platform that bridges the gap between affordability, usability, and feature richness in event management. More specifically, we sought to accomplish the following technical and user-centered objectives:

- **End-to-End Ticketing System**: Allow organizers to create events and issue dynamic, tamper-proof tickets embedded with QR codes.
- **Role-based Access**: Provide unique user interfaces and permissions for organizers, and attendees.
- **Real-Time Check-in**: Enable event organizers to scan QR codes and validate tickets with instant feedback.
- **Dashboard & Analytics**: Offer live metrics for event organizers to monitor ticket sales and check-in rates.
- **Responsive User Interface**: Ensure usability on mobile devices, tablets, and desktops with a clean design powered by Tailwind CSS.
- **Extensible Architecture**: Use modular code practices to make it easy to add future enhancements such as payment gateways, email notifications, and calendar syncing.

These objectives helped guide our technology choices and development workflow throughout the project lifecycle.

---

## 4. System Architecture and Technology Stack

Our system was developed as a modern full-stack web application using Next.js, leveraging both its front-end rendering capabilities and API support for back-end functionalities. The architectural approach was monorepo-based, with the database schema defined using Prisma ORM and deployed via PostgreSQL.

- **Frontend Framework**: Next.js (App Router, Server Components)
- **Backend Services**: Next.js API Routes
- **Database**: PostgreSQL with Prisma
- **Authentication**: JSON Web Tokens (JWT) + bcrypt
- **Styling**: Tailwind CSS
- **QR Code**: `qrcode` npm package
- **Cloud Deployment**: Vercel
- **Testing Tools**: Jest for unit testing and Cypress for E2E tests
- **CI/CD**: GitHub Actions for build/test workflows

Each user interface and interaction was crafted with clarity and responsiveness in mind, following a mobile-first design philosophy. The backend logic was designed to be stateless and scalable, with encrypted payloads in QR codes to ensure that each ticket could only be validated once.

---

## 5. Features

### 5.1 Role-Based User Authentication
Users are classified into three roles: **Organizer** and **Attendee**. Each role has its own dashboard and set of permissions. Authentication is managed via JSON Web Tokens, which ensures secure and stateless session handling.
- Organizers can create events, manage ticket tiers, view analytics, access the QR scanning module and verify tickets.
- Attendees can register for events and retrieve their generated tickets.

### 5.2 Event Creation and Management
Organizers can create an event by specifying a title, description, capacity, venue, and date/time range. They can also define ticket tiers (e.g., General Admission, VIP), each with separate pricing and capacity limits. The interface supports markdown-formatted descriptions and integrates calendar-friendly timestamps.

### 5.3 QR Code Ticketing
Once an attendee registers for an event, a ticket is generated containing a unique, encrypted QR code. This code includes embedded ticket information (ticket ID, user ID, event ID) and is digitally signed to prevent tampering. Users can view, save, or print the QR code for use during check-in.

### 5.4 Real-Time Check-In Dashboard
Event organizers have access to a web-based scanner module (works on mobile). Upon scanning a QR code, the system verifies the ticket’s validity, checks for duplication, and updates the check-in status in real time. The feedback is immediate—valid, already checked-in, or invalid—with color-coded messages.
Organizers can view a real-time dashboard showing:
- Total registered attendees
- Number checked in
- Remaining capacity

### 5.5 Responsive and Accessible Design
The user interface is built with accessibility in mind. Color contrast, keyboard navigation, and mobile responsiveness were tested across multiple viewports and devices. Tailwind CSS allowed us to maintain a consistent design language with minimal overhead.

---

## 6. User Guide

This project supports two types of users: Organizers and Attendees. Each user type has access to different features within the system. Below is a step-by-step guide to how each user interacts with the platform.

### General Usage
1. Visit: [event-ticketing-and-check-in-system.vercel.app](https://event-ticketing-and-check-in-system.vercel.app)
2. Click on the login button to sign in using your account credentials.
3. If you don't have an account, click the "Register" button and register as required. After successful registration, you will be automatically redirected to log in
4. After logging in, the system will route you to the appropriate dashboard based on your role (Organizer or Attendee).

### For Organizers
Organizers are responsible for creating and managing events. Steps:
1. After logging in as an organizer, you will land on the event dashboard.
2. Click on the “Create Event” button to access the event creation form.
3. Fill in event details including name, description, date, time, location, and capacity.
4. Add ticket tiers with specific pricing and limits.
5. Submit the form to publish the event.
6. You can view a list of created events, track ticket sales, and monitor real-time check-in data from your dashboard.

### For Attendees
Attendees are the users who register for events and receive QR code tickets. Steps:
1. Go to the home page to browse the listed events.
2. Click on a “Purchase” button for an event.
3. Select the type of ticket you want (regular or vip) and the payment information
4. After completing the process, visit the “My Tickets” section to view your QR code ticket.
5. Show this QR code when arriving at the event for scanning.

---

## 7. Development Guide

### 1. Prerequisites
- Node.js 18+
- npm
- PostgreSQL
- Git

### 2. Clone & Setup

```bash
git clone https://github.com/konantian/Event-Ticketing-and-Check-in-System.git
cd event-ticketing-and-check-in-system
npm install
```

### 3. Add Environment Variables

Create `.env.local`:

```env
DATABASE_URL=postgresql://youruser:yourpass@localhost:5432/eventdb
JWT_SECRET=your_very_secure_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Database Initialization

```bash
npx prisma migrate dev --name init
npx prisma generate
npx prisma studio  # (optional)
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 6. Testing

```bash
npm run test
```

Tests are located under the `tests/` folder.

---

## 8. Individual Contribution

| Name         | Contributions                            |
|--------------|-------------------------------------------|
| Yingzhuo Sun | Project report, API unit tests            |
| Yuan Wang    | Backend APIs, UI improvement              |
| Lanhui Shi   | Frontend development, UI/UX design        |

---

## 9. Lessons Learned and Future Work

This project allowed us to apply our full-stack knowledge, covering everything from database modeling and secure authentication to responsive design and real-time logic. We encountered many real-world development scenarios, including edge-case handling, code modularity, and performance optimization.

**Future Improvements**:

- Stripe/PayPal integration for real ticket payments
- Email reminders and push notifications
- Event feedback/survey collection post-check-in

---

## 10. Conclusion

The Event Ticketing and QR Code Check-in System is more than just a course project—it’s a practical tool that could easily be extended into a usable SaaS product. It offers an intuitive, real-time, and secure solution for anyone needing to manage events without the overhead or cost of legacy platforms.
Through this project, we not only learned about the technical intricacies of modern web development but also about designing for real users with real problems. We’re proud of what we’ve built and look forward to continuing its development.

---

## 11. Demo Video

🎥 [Click here to watch the demo video](https://github.com/konantian/Event-Ticketing-and-Check-in-System/raw/main/demo.mp4)
