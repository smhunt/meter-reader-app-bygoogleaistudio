# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlowCheck is a Progressive Web App (PWA) for AI-powered water meter reading using Google's Gemini 2.5 Flash model for OCR. Users capture or upload photos of water meters, and the AI extracts the reading value with confidence scores and bounding box detection.

## Development Commands

```bash
npm run dev      # Start dev server on port 3000
npm run build    # Production build
npm run preview  # Preview production build
```

## Environment Setup

Requires `GEMINI_API_KEY` in `.env.local`:
```
GEMINI_API_KEY=your_key_here
```

## Architecture

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS (via CDN)

**Key Structure:**
- `App.tsx` - Central state management, view routing (dashboard/scan/history/profile)
- `components/` - UI components (Layout, Dashboard, CameraScanner, History)
- `services/geminiService.ts` - Gemini API integration for meter OCR
- `types.ts` - TypeScript interfaces (MeterReading, ScanResult, ViewState)

**Path Alias:** `@/*` maps to project root for imports

**State Flow:** App.tsx holds all state (readings, current view) and passes down to components. No external state management library.

## Gemini Integration

The `geminiService.ts` sends base64-encoded images to Gemini with a structured prompt for water meter OCR:
- Expects 5 black digits + 1 white decimal digit format
- Handles rolling/tumbling digit detection for the tenths place
- Returns `{ value: string, confidence: number, boundingBox: {ymin, xmin, ymax, xmax} }`
- Bounding box coordinates are normalized to 0-1000 scale

## Styling

Dark theme using Tailwind custom colors:
- Background: `#0f172a` (slate-900)
- Surface: `#1e293b` (slate-800)
- Primary: `#06b6d4` (cyan-500)

Custom `scan-line` animation defined in index.html for camera UI.

## PWA Features

Requests camera and geolocation permissions. Mobile-first responsive design with safe area handling for notched devices.
