# Event-Ticketing-and-Check-in-System

## 1. Motivation

### Problem Statement

Managing events can be tricky, especially when it comes to handling registration, ticket sales, and tracking attendees in real time. Organizers often face problems like overselling tickets, messy check-in processes, and limited insights after the event. Many existing solutions rely on outdated systems or manual processes, which leads to inefficiencies, poor user experiences, and higher costs.

Platforms like Eventbrite and Meetup provide some useful tools, but they come with high fees and limited customization. More importantly, most of these platforms lack a smooth, real-time check-in system and robust attendance tracking — both essential for managing large events effectively.

### Why This Project Is Worth Pursuing

This project aims to make event management easier and more efficient for both organizers and attendees. It will automate key tasks like ticketing, check-in, and real-time attendance tracking, helping organizers save time and reduce mistakes. Most of the complex logistics will be handled automatically, making the process smoother for organizers and staff.

Attendees will benefit from quick registration and fast check-ins using QR codes, reducing wait times and entry issues. Real-time data and insights will help organizers make better decisions and improve future events based on actual attendance and user behavior.

The platform will use modern web technologies like Next.js to create a fast and scalable system. QR code-based ticketing will ensure secure and efficient entry, reducing the risk of ticket fraud and helping manage large crowds more effectively. With automation, real-time updates, and a simple design, the platform will solve common event management problems and provide a smoother experience for everyone.

### Target Users
- **Event Organizers** – Require a comprehensive tool to create, manage, and monitor events efficiently.
- **Event Staff** – Need a fast and easy-to-use check-in system that updates in real-time.

### Existing Solutions and Limitations

Platforms like Eventbrite and Meetup are popular, but they have several problems that make event management difficult. One big issue is the high service fees, which take a large percentage of each ticket sale. This lowers profits for organizers and increases costs for attendees. Also, these platforms offer limited options for customizing event creation and registration forms, making it hard for organizers to collect specific information or create a personalized experience for attendees.

Another major problem is the lack of real-time updates. Most platforms don’t provide live check-in or attendance tracking, which makes managing large events more difficult. The user experience is also often poor, with slow and outdated interfaces that don’t work well on mobile devices. This can frustrate both organizers and attendees, especially during busy check-in times.

Our platform aims to solve these issues by offering low-cost or free options for organizers, reducing the cost of hosting events. It will provide fully customizable registration forms so organizers can collect the data they need and create a better experience for attendees. Real-time updates for check-ins and attendance tracking will be included, helping organizers monitor events more easily. Secure QR code-based ticket validation will also improve the check-in process, reducing errors and speeding up entry. With better customization, real-time insights, and a smoother user experience, our platform will offer a strong advantage over existing solutions.

---

## 2. Objectives and Key Features

### Project Objectives

The main objective is to develop a full-stack platform that simplifies event management through modern, efficient, and secure technology. The platform will provide a seamless experience for organizers, staff, and attendees, focusing on automation, real-time updates, and user-friendly design.

### Core Features and Technical Implementation

Our platform will offer a comprehensive set of core features designed to streamline event management and improve the overall user experience for organizers, staff, and attendees.

1. **User Authentication:**
   - Implemented using JWT (JSON Web Tokens) for secure login sessions.
   - Passwords securely hashed using bcrypt.
   - Separate access levels for organizers, staff, and attendees.

2. **Event Creation and Registration:**
   - Organizers can create and edit events through an intuitive interface.
   - Customizable registration forms to collect specific attendee information.
   - Tiered ticket pricing (General, VIP) with discount codes and promotions.

3. **Ticket Processing:**
   - Each ticket purchase generates a unique, encrypted QR code.
   - Tickets stored in the database, accessible via user account.

4. **Real-Time Check-In and Validation:**(if time permits)
   - Staff can scan QR codes using a mobile interface.
   - Immediate status updates for check-in.
   - Duplicate or invalid QR code notifications.
   - Real-time dashboard showing number of attendees who have checked in.

5. **Attendance Analytics and Reporting:**(if time permits)
   - Real-time data on attendee numbers and check-in rates.
   - Exportable reports in CSV and PDF formats.
   - Graphs and charts for visual insights.

6. **Automated Email Communication:**(if time permits)
   - Confirmation emails upon registration and purchase.
   - Reminder emails before the event.
   - Post-event thank-you emails and surveys.

7. **Waitlist Management:**
   - System handles waitlisted attendees when spots open.
   - Automated notifications for available tickets.

8. **Mobile-Responsive Interface:**
   - Tailwind CSS for a clean and modern design.
   - Fully responsive across smartphones, tablets, and desktops.
   - Next.js SSR for fast page loads and a consistent user experience.

### Technical Implementation Approach

- **Frontend** and **Backend** – Built using Next.js full-stack for fast rendering and SEO optimization. Using server components for backend logic and API routes.
- **Database** – PostgreSQL for secure and scalable storage of transaction data.
- **Cloud Storage** – Digital Ocean or Google Cloud Storage for event assets.

### Database Schema and Relationships

1. **User Table**
   - User ID (Primary Key)
   - Role (Organizer, Staff, Attendee)
   - Email
   - Password (Hashed)

2. **Event Table**
   - Event ID (Primary Key)
   - Organizer ID (Foreign Key)
   - Event Name
   - Event Description
   - Event Capacity
   - Location
   - Start and End Time

3. **Ticket Table**
   - Ticket ID (Primary Key)
   - User ID (Foreign Key)
   - Event ID (Foreign Key)
   - Price
   - Tier (General, VIP)
   - QR Code Data
   - Discount code ID (Foreign Key)

4. **Check-in Table**
   - Check-in ID (Primary Key)
   - Ticket ID (Foreign Key)
   - Status (Checked In, Not Checked In)
   - Timestamp
    
5. **Discount Table**
    - Discount ID (Primary Key)
    - Discount code
    - Discount Type (Percentage or Fixed Amount)
    - Discount Value
    - Times Used

---

## 3. Tentative Plan

### Team Responsibilities

| **Team Member** | **Responsibility**                                                              |
|-----------------|---------------------------------------------------------------------------------|
| Yuan Wang       | Backend development – User authentication, API setup, database integration      |
| Lanhui Shi    | Frontend development – UI/UX design, event creation, registration forms          |
| Yingzhuo Sun      | QR code generation, check-in processing, and code testing             |

### Development Strategy

1. **Week 1–2**:
   - Set up project structure using Next.js.
   - Develop user authentication and role-based access.

2. **Week 3–4**:
   - Implement event creation and registration flow.
   - Set up database schema and relationships.

3. **Week 5**:
   - Develop QR code generation and check-in validation.
   - Implement real-time dashboard and analytics.

4. **Week 6**:
   - Test end-to-end functionality.
   - Final UI/UX improvements.

### Testing and Debugging

- **Unit and integration testing** using Jest.
- **End-to-end testing** using Cypress.
- **Load testing** with Artillery to ensure scalability.
