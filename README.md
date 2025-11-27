RyyderBros Wellness — Online Therapy Booking Platform

A full-stack wellness booking system that enables clients to book therapy sessions, therapists to manage availability, and admins to oversee the platform — with Google OAuth Login, Google Calendar integration, and a complete backend architecture.

🚀 Live Demo

Client (Vercel): https://ryyderbros-wellness.vercel.app

Backend API (Render): https://ryyderbros-wellness-backend.onrender.com

📌 Project Overview

RyyderBros Wellness is a production-ready, full-stack web application built for therapy session scheduling. It includes:

Secure Google OAuth 2.0 login

JWT-based session authentication

Therapist slot management dashboard

Real-time booking system with Google Meet auto-generation

Role-based access (Client, Therapist, Admin)

Fully deployed using Render (Backend) and Vercel (Frontend)

🧱 System Architecture
Tech Stack
Layer	Technology	Purpose
Frontend	React + Vite + Tailwind	UI, routing, token storage
Backend	Node.js + Express	APIs, authentication, Google OAuth
Database	PostgreSQL (Render)	Users, therapists, slots, bookings
Auth Provider	Google OAuth 2.0	Login & identity validation
External API	Google Calendar API	Creating Google Meet booking events
Deployment	Vercel (client), Render (server)	Production hosting
🔐 Core Features
✅ Google OAuth Login

Users authenticate via Google

Backend validates the user

JWT token is issued and returned to the frontend

Roles are automatically assigned (client/therapist/admin)

🎯 Client Features

View therapists

View available slots

Book sessions

Receive Google Meet link automatically

View upcoming bookings

🧑‍⚕️ Therapist Dashboard

Manage available session slots

Mark availability

View client bookings

Delete/cancel sessions

🛠️ Admin Portal

Access to master dashboard

View all bookings across the system

Manage therapists and roles

📅 Google Calendar Integration

When a client books a slot:

Backend contacts Google Calendar

A Google Meet link is generated

Calendar invites are sent to both therapist + client

Link stored in DB and shown on the client app

📂 Repository Structure
.
├── client/
│   ├── src/
│   ├── pages/
│   ├── components/
│   └── ...
│
└── server/
    ├── src/
    │   ├── routes/
    │   ├── controllers/
    │   ├── models/
    │   ├── middleware/
    │   └── utils/
    └── server.js


🔄 Authentication Flow

Client clicks Sign In with Google

Backend redirects to Google OAuth screen

Google verifies the user

Backend generates JWT

Client stores JWT in localStorage

All future API calls use:

Authorization: Bearer <token>

🏗️ Booking Flow

Client selects a therapist

Selects an available slot

Backend checks DB → slot available?

Backend creates a Google Calendar Meet event

Database updated: is_booked = true

Client sees confirmation + meeting link

🗄️ Database Schema (Simplified)
users
id	name	email	role
slots

| id | therapist_id | start_time | end_time | is_booked |

bookings

| id | client_id | therapist_id | slot_id | meet_link |

🛠️ Environment Variables

Frontend (.env)

VITE_API_URL=<backend-api-url>


Backend (.env)

PORT=4000
CLIENT_URL=<frontend-url>
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<secret>
GOOGLE_CALLBACK_URL=<oauth-callback>
DATABASE_URL=<postgres-connection>
JWT_SECRET=<your-secret>
NODE_ENV=production

▶️ Local Development Setup
1️⃣ Clone the repository
git clone https://github.com/<your-username>/ryyderbros_wellness.git
cd ryyderbros_wellness

2️⃣ Install dependencies

Client

cd client
npm install
npm run dev


Server

cd server
npm install
npm run dev

🌍 Deployment
Frontend

Deployed on Vercel

Automatically builds on push to main / master

Backend

Deployed on Render Web Service

Uses environment variables

Auto-deploys on push

📌 Future Enhancements

Therapist earnings dashboard

SMS reminders (Twilio)

AI-based session matching

Admin reports for analytics

Automatic rescheduling workflow

🤝 Contributing

Pull requests are welcome.
For major changes, open an issue first to discuss what you would like to improve.

📜 License

MIT License – free for personal and commercial use.
