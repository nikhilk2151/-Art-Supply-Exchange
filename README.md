# 🎨 Art Supply Exchange

> A modern, full-stack pre-loved creator marketplace for artists, students, and studio creators to buy, sell, swap, and trade art supplies locally.

---

## 🌟 Key Features & Highlights

- 🎨 **Creator Marketplace**: Browse paints, brushes, canvases, sketchbooks, studio tools, and gear with instant title search, category filtering, price sorting, and condition filters.
- 📱 **100% Fully Responsive Layout**: Auto-resizing design across mobile smartphones, tablets, laptops, and wide desktop screens, featuring a mobile drawer navigation menu and dynamic aspect-ratio image galleries.
- 🔐 **Authentication & Accounts**: Supports Google Sign-In (Firebase Auth) and secure JWT email/password authentication with editable user profiles (name, city, state, bio, custom avatar).
- ☁️ **Cloudinary Image Storage**: Instant client-side image compression and direct upload to Cloudinary CDN storage. Deleting a product automatically destroys its images from Cloudinary to keep cloud storage clean.
- 💬 **Real-Time Direct Messaging**: Live socket-powered messaging via Socket.IO for buyers and sellers to negotiate and arrange local pickups. Includes auto-cleanup policy for chat privacy.
- 🔄 **Swap & Purchase Workflow**: Propose item-for-item swaps or direct purchase requests with real-time inbox notification counters and status updates (Pending, Accepted, Declined, Swapped, Sold).
- ⚡ **Admin Moderation Panel**: Platform analytics dashboard, user ban management, listing moderation, and user reports handling.

---

## 🏗️ Tech Stack

### **Frontend**
- **Framework**: React 19 + Vite 5
- **Styling**: Tailwind CSS 3 (Glassmorphism design, custom palette, Google Playfair Display & Plus Jakarta Sans typography)
- **Routing**: React Router DOM 6
- **State & HTTP**: Zustand, Axios
- **Real-Time & Auth**: Socket.IO-Client, Firebase SDK (Google Auth)

### **Backend**
- **Runtime**: Node.js + Express.js (ES Modules)
- **Database**: MongoDB + Mongoose (with built-in in-memory MongoDB fallback for instant local testing)
- **Cloud Storage**: Cloudinary Node SDK (for CDN image hosting & automatic image destruction)
- **Real-Time Engine**: Socket.IO Server
- **Security**: JSON Web Tokens (JWT), BcryptJS password hashing, Cors, Dotenv

---

## 📂 Project Architecture

```
project/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI Components & Modals (EditProfileModal, etc.)
│   │   ├── pages/              # Main Route Views (HomePage, MarketplacePage, ListingDetailPage,
│   │   │                       # AuthPage, DashboardPage, ChatPage, SwapPage, AdminPage)
│   │   ├── firebase.js         # Firebase Authentication Configuration
│   │   ├── App.jsx             # Root Router & Navigation Header with Mobile Drawer
│   │   ├── main.jsx            # React App Entry Point
│   │   └── index.css           # Global Tailwind & Custom Art Design Tokens
│   ├── index.html              # HTML5 Shell with Viewport Meta Tags
│   └── package.json            # Client Dependencies & Scripts
│
├── server/                     # Express.js + MongoDB Backend
│   ├── src/
│   │   ├── middleware/         # Auth Middleware (JWT & Admin Guard)
│   │   ├── models/             # Mongoose Schemas (User, Listing, SwapRequest, Transaction, Message, Conversation, Report)
│   │   ├── routes/             # REST API Endpoints (authRoutes, listingRoutes, swapRoutes, chatRoutes, adminRoutes, etc.)
│   │   ├── utils/              # Cloudinary Integration & Image Helpers
│   │   ├── seed.js             # Seed Script for Sample Users & Product Listings
│   │   ├── clean_chats.js      # Automatic 48-Hour Chat Expiration Cleanup Utility
│   │   └── server.js           # Server Entry Point & Socket.IO Listener
│   └── package.json            # Server Dependencies & Scripts
│
├── package.json                # Workspace Package Config (npm run dev)
└── README.md                   # Project Documentation
```

---

## 🛠️ Environment Configuration

### 1. Server Configuration (`server/.env`)

Create or edit `server/.env`:

```env
PORT=5000
NODE_ENV=development
USE_IN_MEMORY_DB=false
MONGO_URI=mongodb://127.0.0.1:27017/art-supply-exchange
JWT_SECRET=art-supply-exchange-secret-key-2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Cloudinary Storage Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Client Configuration (`client/.env`)

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Firebase Auth Configuration (Google Sign-In)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

---

## 🚀 Quick Start & Running Locally

### 1. Install Dependencies

From the project root directory, install workspace dependencies:

```bash
npm install
```

### 2. Seed Sample Data (Optional)

To seed initial sample listings and users into MongoDB:

```bash
cd server
npm run seed
cd ..
```

### 3. Run Development Servers

From the root directory, launch both backend and frontend concurrently:

```bash
npm run dev
```

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`

---

## 📡 REST API Reference

| Module | Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Register new user | Public |
| | `POST` | `/api/auth/login` | Login user & get JWT | Public |
| | `POST` | `/api/auth/google` | Google sign-in auth sync | Public |
| | `GET` | `/api/auth/me` | Fetch logged-in user profile | Required |
| | `PUT` | `/api/auth/profile` | Update profile details / avatar | Required |
| **Listings** | `GET` | `/api/listings` | Search & filter marketplace items | Public |
| | `GET` | `/api/listings/:id` | Fetch listing details & seller info | Public |
| | `POST` | `/api/listings` | Create listing with image upload | Required |
| | `PUT` | `/api/listings/:id` | Update listing details or images | Owner / Admin |
| | `DELETE`| `/api/listings/:id` | Delete listing & destroy Cloudinary images | Owner / Admin |
| **Swaps** | `POST` | `/api/swaps` | Propose an item swap request | Required |
| | `GET` | `/api/swaps/received`| Fetch received swap requests | Required |
| | `PATCH`| `/api/swaps/:id/accept`| Accept swap offer | Required |
| | `PATCH`| `/api/swaps/:id/reject`| Reject swap offer | Required |
| **Chats** | `GET` | `/api/chats` | List active conversations | Required |
| | `POST` | `/api/chats` | Start direct message thread | Required |
| | `GET` | `/api/chats/:id/messages`| Fetch chat message history | Required |
| **Admin** | `GET` | `/api/admin/stats` | Platform statistics | Admin |
| | `GET` | `/api/admin/users` | Manage users & ban status | Admin |
| | `DELETE`| `/api/admin/listings/:id`| Moderate & remove listings | Admin |

---

## 🚀 Single-Platform Deployment (Render.com)

The entire full-stack application (Frontend + Express API + Socket.IO WebSockets) is configured to deploy together on **Render.com** under a single service and single URL:

1. **Connect GitHub Repo**: Sign in to [Render.com](https://render.com) and create a **New Web Service** connected to `https://github.com/nikhilk2151/-Art-Supply-Exchange`.
2. **Build & Start Commands**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGO_URI`: *(Your MongoDB Atlas connection string)*
   - `JWT_SECRET`: `art-supply-exchange-secret-key-2026`
   - `CLOUDINARY_CLOUD_NAME`: `dcjhbeyvo`
   - `CLOUDINARY_API_KEY`: `677256696187545`
   - `CLOUDINARY_API_SECRET`: `6ukIKSSnRgRyXOIfj_gJAlOJtbU`

---

## 📜 License

This project is open-source and available under the **MIT License**.
