# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Next.js 16** supervisor dashboard for monitoring AI-powered customer support calls using **LiveKit** for real-time audio communication. Supervisors can view active call queues, monitor escalations, and join calls to assist AI agents.

## Common Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:3000

# Build & Deploy
npm run build        # Production build
npm start            # Start production server

# Linting
npm run lint         # Run ESLint (eslint-config-next/typescript)
```

## Architecture

### Tech Stack
- **Next.js 16** with App Router
- **React 19** with React Compiler enabled (`next.config.ts`)
- **TypeScript** with strict mode
- **Tailwind CSS v4** (`@import "tailwindcss"` in globals.css)
- **LiveKit** (@livekit/components-react, livekit-server-sdk) for WebRTC audio
- **Lucide React** for icons

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── token/route.ts      # JWT generation for LiveKit auth
│   │   └── rooms/route.ts      # List active rooms (RoomServiceClient)
│   ├── layout.tsx              # Root layout with Geist fonts
│   ├── page.tsx                # View switcher: Dashboard ↔ LiveKitRoom
│   └── globals.css             # Tailwind v4 imports
└── components/
    ├── Dashboard.tsx           # Queue/escalation list (polls /api/rooms every 5s)
    ├── ActiveCallView.tsx      # In-call UI with transcript, controls
    └── AgentHealthGuard.tsx    # AI agent connection status monitor
```

### Key Patterns

**Client Components**: All components using LiveKit hooks must be marked `'use client'`:
- `page.tsx` - Uses LiveKitRoom component
- `ActiveCallView.tsx` - Uses `useRoomContext()`, `useParticipants()`, `useTracks()`
- `AgentHealthGuard.tsx` - Uses `useRemoteParticipants()`

**Metadata-Driven UI**: Rooms store JSON metadata with call context:
```typescript
interface RoomMeta {
  status?: 'escalated' | 'active'
  reason?: string           // Escalation reason
  summary?: string          // AI-generated summary
  customerName?: string
  policyNumber?: string
  issueType?: string
  messages?: Array<{ role: 'agent' | 'customer' | 'system', content: string }>
  escalatedAt?: string
}
```

**View State Flow**:
1. `page.tsx` manages `activeRoom` and `token` state
2. No active room → renders `<Dashboard onJoin={handleJoin} />`
3. Join clicked → fetches JWT from `/api/token?room={name}`
4. Active room + token → renders `<LiveKitRoom><ActiveCallView /></LiveKitRoom>`
5. Leave/disconnect → `reset()` clears state, returns to Dashboard

### API Routes

**GET /api/rooms**: Returns active LiveKit rooms via `RoomServiceClient.listRooms()`
- Called by Dashboard.tsx every 5 seconds via `setInterval`

**GET /api/token?room={name}**: Generates JWT for supervisor authentication
- Creates random identity `supervisor_${random}`
- Grants: `roomJoin: true`, `canPublish: true`, `canSubscribe: true`

### Environment Variables

Required in `.env.local`:
```env
LIVEKIT_URL=wss://your-server.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
NEXT_PUBLIC_LIVEKIT_URL=...    # Client-side WebSocket URL
```

### Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json)

## Dependencies Notes

- `babel-plugin-react-compiler` is installed but React Compiler runs via Next.js config
- `@tailwindcss/postcss` v4 is used (not the traditional tailwindcss CLI setup)
- `clsx` and `tailwind-merge` are available for className manipulation
