# Release Notes – FoundPath v1.0.0

**Release date:** 2026-05-25  
**Project:** FoundPath – VSU Lost & Found  

Welcome to the **first public release** of FoundPath! This release delivers a complete, production‑ready lost‑and‑found platform for the VSU campus community. All core features are implemented and fully functional.

---

## ✨ What's New

### 🆕 Report lost or found items
- Submit detailed reports with title, description, category, location (map + free‑text building), date/time, and optional photos.
- For found items, you must provide a **security question** – only the true owner can answer it.
- **Private notes** (Samaritan notes) are stored separately and only visible to you.

### 🆕 Smart matching
- When you report an item, the system automatically searches for potential matches of the opposite type with the same category within 500 m.
- Both parties receive an in‑app notification (if they have enabled match alerts).

### 🆕 Claim system for found items
- **Claimants** answer the security question to initiate a claim.
- **Samaritans** (the finder) review pending claims, compare answers with their private notes, and can **Accept** (start handshake) or **Reject + Penalize** (−10 reputation).
- After acceptance, a **handshake modal** shows the claimant’s contact details (name, email, phone) and provides a **“Create Email Thread”** button to coordinate the handoff.
- Once the item is physically returned, the Samaritan clicks **“Complete Handover”**:  
  - Item status becomes `resolved`  
  - The Samaritan gains **+10 reputation**  
  - All other pending claims are declined (no penalty).

### 🆕 Lost item “Found this”
- If you find a lost item, click **“I Found This”** – a modal displays the owner’s contact and a **“Found this”** button.
- The owner receives an in‑app notification and can view all finders in a dedicated modal, then contact each finder via email.

### 🆕 Unified Claims page (`/claims`)
- **Two tabs:** “Items I Claimed” (your claims on others’ items) and “Items with Pending Claims” (claims on your found items).
- Full item cards with status badges, claim tickets, and action buttons that open the appropriate modal.

### 🆕 Profile & settings
- **Avatar upload** – change your profile picture (JPEG/PNG, max 5 MB).
- **Unified settings page** – all settings (Profile, Notifications, Security) on one scrollable page with a **scroll‑spy sidebar**.
- **Reputation badge** – coloured (red, orange, blue, green) according to your trust score (0–200). A progress bar shows your current level.
- **Notification preferences** – toggle match alerts, claim updates, and digest frequency.
- **Password update** – change your password securely (no current password required).

### 🆕 Real‑time updates
- Inventory and My Items pages refresh automatically when items are created, edited, or deleted – no page reload needed.

### 🆕 Responsive design & accessibility
- **Mobile bottom navigation** with a prominent “Report” button.
- **Collapsible sidebar** (desktop) that remembers your preference.
- **Skip to main content** link and ARIA landmarks for screen readers.
- All modals stack vertically on mobile and use two columns on desktop.

---

## ✅ What works

- Sign up / Login (email/password and Google OAuth)
- Report items (lost/found) with images, location picker, and security question
- Browse inventory and filter by type, category, and keyword
- My Items – view, edit, and delete your own active items
- Claim submission, acceptance/rejection, handshake modal, final resolution
- “Found this” for lost items (notify owner, list finders)
- In‑app notifications (bell icon) – 30‑second polling
- Reputation changes (+10 on handover, −10 on false claim)
- Profile updates, avatar upload, password change
- Responsive UI on all devices (tested on iPhone SE, iPad Air, desktop)

---

## ⚠️ Known issues

- **Image carousel** – swipe gestures are not supported; users must tap the on‑screen arrows.
- **Email client** – opening an email thread relies on the user’s default mail handler. A manual copy‑link fallback is provided.
- **Two‑factor authentication** – the toggle in Security Settings is UI‑only (mock).
- **Login activity** – the displayed sessions are static example data; real session logging is not yet implemented.
- **Admin dashboard** – only a stub page exists; administrators use the Supabase Dashboard directly.

---

## 🔜 Coming in future releases

- Full two‑factor authentication (backend + authenticator app)
- Real login activity history (IP, device, location)
- Admin dashboard for managing users, items, and claims
- Email notifications for matches, claims, and handshakes
- Improved smart matching UI (dedicated “Matched items” page)

---

## 📦 Get started

Visit the live application at [https://foundpath-vsu.vercel.app](https://foundpath-vsu.vercel.app) (replace with actual URL) or scan the campus QR code to report or claim items on the go.

For local development, see the [README](./README.md) for setup instructions.

---

*FoundPath – Restoring peace of mind, one item at a time.*  
*Visayas State University, Baybay City, Leyte, Philippines*  
*Platform-Based Development*

*Academic Year 2025‑2026*