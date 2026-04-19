# Project Explainer

This is a **Next.js 16** application that provides a supervisor dashboard for monitoring AI-powered customer support calls using **LiveKit** for real-time audio communication.

---

## Prerequisites

- Node.js 18+ (LTS recommended)
- A LiveKit account and server instance (cloud or self-hosted)

---

## Installation Instructions

### 1. Install Dependencies

```bash
cd dashboard
npm install
```

This installs:
- **next** (16.2.3) - React framework with React Compiler enabled
- **react/react-dom** (19.2.4) - UI library
- **@livekit/components-react** - Pre-built LiveKit React components
- **@livekit/components-styles** - LiveKit component styles
- **livekit-client** - Client-side LiveKit SDK for WebRTC
- **livekit-server-sdk** - Server-side LiveKit SDK for token generation and room management
- **lucide-react** - Icon library
- **tailwindcss** (v4) - Utility-first CSS framework
- **typescript** - Type safety

### 2. Environment Variables

Create a `.env.local` file in the `/dashboard` directory:

```env
# LiveKit Server Configuration
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# Public LiveKit URL (for client-side connection)
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.com
```

Get these values from your LiveKit Cloud dashboard or self-hosted instance.

### 3. Run the Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

---

## Project Architecture

### File Structure and Purpose

```
dashboard/
├── next.config.ts          # Next.js configuration (React Compiler enabled)
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── token/      # JWT token generation for LiveKit auth
│   │   │   └── rooms/      # Room listing API for dashboard
│   │   ├── globals.css     # Global styles with Tailwind v4
│   │   ├── layout.tsx      # Root layout with fonts
│   │   └── page.tsx        # Main page (dashboard ↔ call view switcher)
│   └── components/
│       ├── Dashboard.tsx   # Supervisor dashboard UI
│       ├── ActiveCallView.tsx  # Live call monitoring interface
│       └── AgentHealthGuard.tsx # AI agent connection status monitor
```

---

## File-by-File Explanation

### Configuration Files

#### `next.config.ts`
Enables the **React Compiler** for automatic memoization and performance optimization. Minimal configuration for a Next.js 16 app router project.

#### `tsconfig.json`
Standard TypeScript configuration for Next.js with:
- Module path aliasing (`@/*` → `./src/*`)
- Strict type checking enabled
- Next.js plugin integration

---

### API Routes (`/app/api/`)

#### `token/route.ts`
**Purpose**: Generates JWT access tokens for LiveKit authentication.

**How it works**:
- Accepts a `room` query parameter
- Creates an access token with a random supervisor identity (`supervisor_XXX`)
- Grants permissions: join room, publish audio, subscribe to tracks
- Returns the JWT token as JSON

**Called by**: `page.tsx` when joining a room

#### `rooms/route.ts`
**Purpose**: Lists all active LiveKit rooms.

**How it works**:
- Uses LiveKit's `RoomServiceClient` with environment credentials
- Calls `listRooms()` to fetch all active rooms
- Returns room data (SID, name, participant count, metadata) as JSON

**Called by**: `Dashboard.tsx` (polls every 5 seconds)

---

### App Files (`/app/`)

#### `layout.tsx`
**Purpose**: Root layout wrapper for all pages.

**Key features**:
- Loads Geist Sans and Geist Mono fonts from Google Fonts
- Sets up HTML structure with proper language and CSS classes
- Applies base styling (full height, flex column layout)

#### `globals.css`
**Purpose**: Global CSS styles.

**Key features**:
- Imports Tailwind CSS v4 (`@import "tailwindcss"`)
- Defines CSS variables for light/dark mode backgrounds
- Applies Tailwind theme configuration inline

#### `page.tsx`
**Purpose**: Main application page - switches between Dashboard and Active Call views.

**How it works**:
1. **State management**: Tracks `activeRoom` (currently joined room) and `token` (JWT for auth)
2. **View switching**: If `activeRoom` and `token` exist, renders `LiveKitRoom` wrapper with `ActiveCallView`
3. **Otherwise**: Renders `Dashboard` component
4. **Token fetching**: `handleJoin()` fetches a JWT token from `/api/token` when joining a room
5. **Cleanup**: `reset()` clears state when disconnecting from a call

**Key component**: `LiveKitRoom` from `@livekit/components-react` - manages the WebRTC connection

---

### Component Files (`/components/`)

#### `Dashboard.tsx`
**Purpose**: Supervisor dashboard showing active queues and escalations.

**How it works**:
1. **Room polling**: Uses `useEffect` to poll `/api/rooms` every 5 seconds
2. **Data categorization**: Splits rooms into:
   - `escalated`: Rooms where `metadata.status === 'escalated'` (require human attention)
   - `queue`: All other active rooms
3. **Metadata parsing**: Each room has JSON metadata containing customer info, AI summary, messages, etc.
4. **UI sections**:
   - Top navigation with status indicator
   - Metric cards (Active Queue count, Escalations count, Resolved Today, Total Sessions)
   - Two panels: "Requires Attention" (escalations) and "Active Queue"
   - Each room shows: customer name, policy number, issue type, live status indicator

**Key function**: `parseMeta()` safely parses JSON metadata with fallback to empty object

#### `ActiveCallView.tsx`
**Purpose**: In-call interface for supervisors monitoring AI-customer conversations.

**How it works**:
1. **LiveKit hooks**:
   - `useRoomContext()` - Access to the current room
   - `useParticipants()` - List of connected participants
   - `useTracks()` - Audio tracks for playback

2. **Metadata display**: Parses room metadata to show:
   - Customer name, policy number, issue type
   - AI-generated conversation summary
   - Escalation banner if status is 'escalated'
   - Conversation transcript (messages array from metadata)

3. **Audio handling**:
   - Renders `AudioTrack` components for remote participants (excludes self)
   - Can be muted via speaker mute toggle

4. **Call controls**:
   - Microphone mute/unmute toggle
   - Speaker mute toggle
   - Leave call button (disconnects and returns to dashboard)

5. **Timer**: Counts elapsed time since joining the call

6. **Participants display**: Shows connection status for Customer, AI Agent, and Supervisor

**Sub-components**:
- `InfoField` - Labeled data display
- `ParticipantChip` - User card with online/offline status
- `TranscriptBubble` - Message styling (customer left-aligned, agent right-aligned)
- `ControlButton` - Reusable call control button

#### `AgentHealthGuard.tsx`
**Purpose**: Monitors AI agent health and displays warnings.

**How it works**:
- Checks if an AI agent participant exists (identity containing "agent")
- Monitors agent connection quality
- Shows warning if agent connection quality is 'poor'
- Shows error if customer is present but agent is missing (disconnected)
- Returns `null` (no render) when healthy

---

## Data Flow

```
1. Dashboard loads → Fetches room list from /api/rooms (polls every 5s)
2. Supervisor clicks "Join" → page.tsx fetches token from /api/token
3. LiveKitRoom connects to LiveKit server with JWT token
4. ActiveCallView renders with LiveKit context
5. Audio streams between Supervisor ↔ Customer ↔ AI Agent
6. Metadata (transcripts, summaries) read from room.metadata
7. Supervisor clicks "Leave" → Connection closed, returns to Dashboard
```

---

## Room Metadata Structure

Rooms contain JSON metadata with this structure:

```typescript
{
  status?: 'escalated' | 'active',
  reason?: string,           // Escalation reason
  summary?: string,          // AI-generated call summary
  context?: string,         // Additional context
  customerName?: string,
  policyNumber?: string,
  issueType?: string,
  messages?: Array<{
    role: 'agent' | 'customer' | 'system',
    content: string,
    timestamp?: string
  }>,
  escalatedAt?: string      // ISO timestamp
}
```

This metadata is set by the AI agent system and read by this dashboard.

---

## Key Technologies Summary

| Technology | Purpose |
|------------|---------|
| Next.js 16 | React framework with App Router |
| React 19 | UI library with React Compiler |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| LiveKit | WebRTC real-time audio/video |
| Lucide React | Icons |
| Geist Font | Typography |

---

## Development Notes

- **React Compiler**: Enabled in `next.config.ts` for automatic performance optimization
- **Client Components**: Components using LiveKit hooks are marked with `'use client'`
- **Polling**: Room list updates every 5 seconds via `setInterval`
- **Environment**: All LiveKit credentials must be set in `.env.local`
- **Port**: Default development port is 3000