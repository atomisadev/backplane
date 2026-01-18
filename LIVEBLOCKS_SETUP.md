# Liveblocks Real-Time Collaboration Setup

This project now includes real-time collaboration using Liveblocks. Users can share a project URL and collaborate in real-time with cursor tracking and shared editing.

## Setup Instructions

### 1. Install Dependencies

```bash
# Frontend
cd apps/web
npm install @liveblocks/client @liveblocks/react

# Backend
cd apps/api
npm install @liveblocks/node
```

### 2. Get Liveblocks API Keys

1. Sign up at [liveblocks.io](https://liveblocks.io)
2. Create a new project
3. Get your **Public Key** and **Secret Key** from the dashboard

### 3. Configure Environment Variables

**Frontend (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=your_public_key_here
```

**Backend (`apps/api/.env`):**
```env
LIVEBLOCKS_SECRET_KEY=your_secret_key_here
```

### 4. Usage

1. Open any project page
2. Click the **Users** icon button in the header (next to Settings)
3. A dialog will appear with a shareable URL
4. Copy and share the URL with other logged-in users
5. When they open the URL, they'll join the same room and you'll see:
   - Their cursors in real-time
   - Collaborative editing of schema changes

## Features

- ✅ Real-time cursor tracking
- ✅ Shareable project URLs
- ✅ User presence (see who's in the room)
- ✅ Collaborative editing (pending changes sync across users)

## Architecture

- **Room ID**: Each project uses a room ID format: `project-{projectId}`
- **Presence**: Tracks cursor position and user info
- **Storage**: Pending changes are synced across all users in the room
- **Auth**: Uses your existing better-auth session for authentication

## API Endpoints

- `POST /api/liveblocks/auth` - Liveblocks authentication endpoint (handles user authorization)
