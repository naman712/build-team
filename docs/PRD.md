# FounderNow - Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** December 11, 2025  
**Product Name:** FounderNow  
**Domain:** https://foundernow.in  
**Support Contact:** naman@foundernow.in

---

## 1. Executive Summary

FounderNow is a co-founder matching platform that helps founders, entrepreneurs, and builders discover compatible co-founders and collaborators through a swipe-based interface combined with a startup-focused feed. The platform enables meaningful professional connections through intelligent matching, real-time messaging, and community engagement features.

---

## 2. Target Personas

### 2.1 First-Time Founders
- Looking for technical or business co-founders
- Need guidance and partnership to launch their first venture

### 2.2 Domain Experts
- Professionals with industry expertise
- Want to join a startup in a leadership role

### 2.3 Student Innovators
- University students with innovative ideas
- Looking to build teams and find like-minded collaborators

---

## 3. Core Features

### 3.1 Authentication & Onboarding

#### 3.1.1 Signup Flow
- **Single-step signup** collecting: name, email, phone number, and password
- Email auto-confirmed (no OTP verification required)
- Password reset/forgot password functionality disabled
- Optional referral code field during signup

#### 3.1.2 Login Flow
- Email and password authentication
- Automatic redirect to main app upon successful login
- Unauthenticated users redirected to auth page when accessing protected routes

#### 3.1.3 Mandatory Profile Completion
Users must complete all mandatory fields before accessing core features:

**Mandatory Fields:**
- Profile photo
- Name
- Age
- Contact number
- Email
- City/Country
- What they're looking for
- About me
- My idea
- Interests

**Optional Fields:**
- Professional experience
- Education
- Idea intro video (max 50MB)
- Startup name
- Relevant links

---

### 3.2 User Profile

#### 3.2.1 Profile Dashboard
- Profile completion percentage indicator
- Streak badge display (current streak with Zap icon)
- All profile information displayed in organized sections

#### 3.2.2 Profile Editing
- **Unified edit modal** accessible via "Edit Profile" button
- All fields editable from single dialog:
  - Basic info (photo, name, age, email, phone, city, country)
  - Startup details (startup name, about me, my idea, looking for)
  - Interests (tag-based selection)
  - Links (multiple URLs)
  - Experience entries (add/view/delete)
  - Education entries (add/view/delete)
  - Intro video upload

#### 3.2.3 Intro Video
- Users can upload short video about their startup pitch (max 50MB)
- Displayed on own profile and visible to other users
- Playable video section in profile view

#### 3.2.4 Privacy Controls
- **Email and phone are NEVER displayed to other users**
- Contact information only visible to the user themselves
- Profile visibility respects connection status

---

### 3.3 Match/Discover (Co-founder Matching)

#### 3.3.1 Swipe Interface
- Card-based profile display
- **Swipe up** to reject/skip profile
- **"Connect" button** to send connection request
- Shows key profile information for quick evaluation

#### 3.3.2 Profile Cards Display
- Profile photo
- Name and age
- Location (city, country)
- Startup name (if available)
- Looking for description
- About me summary
- Interests tags
- Streak badge

#### 3.3.3 Access Control
- **Requires completed profile** to access
- Incomplete profiles cannot swipe or send connection requests

---

### 3.4 Connections System

#### 3.4.1 Connection States
- **Pending (Received):** Requests from other users awaiting your response
- **Pending (Sent):** Requests you've sent awaiting response
- **Accepted:** Confirmed connections

#### 3.4.2 Connection Actions
- **Accept** incoming connection requests
- **Reject** incoming connection requests
- **Withdraw** sent connection requests (cancel pending requests)
- Request counts displayed on tab labels (e.g., "Requests (3)", "Sent (2)")

#### 3.4.3 Connection Cards
- Profile photo and name
- Startup name
- Looking for description
- Action buttons based on connection state

---

### 3.5 Feed (Startup Timeline)

#### 3.5.1 Post Creation
- Text content (required)
- Image attachment (optional with preview)
- Tags (optional)
- **Requires completed profile** to create posts

#### 3.5.2 Post Display
- Author profile photo, name, and streak badge
- Post content and image (if attached)
- Tags display
- Timestamp
- Like count and comment count
- Action buttons (like, comment, share)

#### 3.5.3 Post Interactions
- **Like/Unlike** posts with sound feedback
- **Comment** on posts (requires completed profile)
- **Share** posts via share dialog

#### 3.5.4 Threaded Comments
- Reply to specific comments
- Hierarchical comment organization
- Expand/collapse reply threads
- Maximum nesting depth: 3 levels
- Visual nesting with "replying to" indicators

#### 3.5.5 Post Editing
- Edit own posts (content, image, tags)
- Delete own posts
- Edit modal with current values pre-filled

---

### 3.6 Post Sharing

#### 3.6.1 Share Dialog
- Native Web Share API integration
- **WhatsApp** sharing
- **Email** sharing
- **Copy link** to clipboard
- **Message** - share directly with connected users via private message

#### 3.6.2 Deep Linking
- Share URLs format: `https://foundernow.in/feed?post=${postId}`
- Shared post opens with focused view
- "Back to Feed" and "View [Author]'s Profile" buttons
- Enables direct linking to individual posts

---

### 3.7 Messaging System

#### 3.7.1 Chat Interface
- Real-time messaging between connected users
- Message list with conversation previews
- Unread message indicators in navbar

#### 3.7.2 Message Features
- Text messages
- **File attachments** (images, PDFs, documents)
- Attachment preview before sending
- Remove selected attachments option
- Sound effects on send/receive

#### 3.7.3 Video Call Scheduling
- Google Calendar integration button
- Schedule Google Meet calls directly from chat
- Quick scheduling for video meetings

#### 3.7.4 Access Control
- **Only connected users can message each other**
- Requires completed profile to access messages

---

### 3.8 Notifications

#### 3.8.1 Notification Types
- **Connection requests** received
- **Accepted connections** (when someone accepts your request)
- **Comments** on your posts
- **Likes** on your posts
- **Note:** Messages do NOT trigger notifications

#### 3.8.2 Notification Delivery
- Browser push notifications (with permission)
- In-app toast notifications
- Notification bell icon in navbar with unread count

---

### 3.9 Streak System

#### 3.9.1 Streak Mechanics
- Streak increments when user **logs in AND creates at least one post** on the same day
- Missing either condition (login or post) resets streak to 0
- Tracks: `current_streak`, `longest_streak`, `last_streak_date`

#### 3.9.2 Streak Display
- Zap icon with current streak count in navbar
- Glow effects and shaking animation when streak is active
- Tooltip explaining streak mechanic on hover
- Displayed on own profile and other users' profiles

---

### 3.10 Referral Program

#### 3.10.1 Referral Code
- Unique 6-character code per user
- Format: "FN" + 4 characters from user_id (e.g., FN1A2B)
- Displayed in drawer menu with share option

#### 3.10.2 Referral Process
- New users enter referral code during signup (optional)
- Referral tracked as "pending" initially

#### 3.10.3 Successful Referral Criteria
A referral is marked successful when referred user:
1. Completes mandatory profile (unlocks Discover section)
2. Creates at least one post

#### 3.10.4 Rewards
- **₹250 Amazon voucher** for every 10 successful referrals
- `successful_referrals` count maintained in profiles table
- Automatic tracking via database triggers

---

### 3.11 Navigation & Layout

#### 3.11.1 Top Navbar (Fixed)
**Left Section:**
- User profile picture (clickable - opens drawer menu)
- Streak badge adjacent to profile picture

**Center Section:**
- Feed link
- Match link
- Connections link
- Spacing between navigation items

**Right Section:**
- Message icon (with unread count)
- Notification icon (with unread count)

#### 3.11.2 Drawer Menu
Triggered by clicking profile picture:
- User profile picture with "My Profile" link
- "Refer and get ₹250" option
- "Account Settings" link
- "Logout" button

#### 3.11.3 Profile Picture Animation
- Spring animation on interaction
- Scale down on tap (0.9)
- Scale up on hover (1.05)

---

### 3.12 Settings

#### 3.12.1 Account Settings
- Profile management link
- Notification preferences
- Privacy settings

#### 3.12.2 Help & Support
- Contact email: naman@foundernow.in
- Link to Contact Us page

---

### 3.13 Landing Page

#### 3.13.1 Hero Section
- Product tagline and value proposition
- "Start Matching" CTA (redirects to auth if not logged in)

#### 3.13.2 Features Section
- Key feature highlights
- Visual illustrations

#### 3.13.3 Footer
- Contact Us link
- Support information

---

## 4. User Experience Features

### 4.1 Sound & Haptic Feedback

#### 4.1.1 Sound Effects
- Liking posts
- Sending messages
- Receiving messages
- Notifications
- Connection requests (swipe sounds)
- Success/click feedback

#### 4.1.2 Haptic Feedback
- All buttons and icons trigger light haptic
- Uses Vibration API for mobile devices

### 4.2 Toast Notifications
- Position: Bottom-center of screen
- Swipe-to-dismiss gesture enabled
- Close button included
- Rich colors for different toast types

### 4.3 Responsive Design
- Fully responsive across all screen sizes
- No excessive blank space on larger screens
- Adaptive max-width constraints
- Content scales appropriately for desktop/tablet/mobile

---

## 5. Access Control Matrix

| Feature | No Profile | Incomplete Profile | Complete Profile |
|---------|------------|-------------------|------------------|
| Landing Page | ✅ | ✅ | ✅ |
| Auth (Login/Signup) | ✅ | ✅ | ✅ |
| View Feed | ❌ | ✅ | ✅ |
| Create Posts | ❌ | ❌ | ✅ |
| Like Posts | ❌ | ❌ | ✅ |
| Comment on Posts | ❌ | ❌ | ✅ |
| Match/Discover | ❌ | ❌ | ✅ |
| Send Connection Requests | ❌ | ❌ | ✅ |
| View Connections | ❌ | ❌ | ✅ |
| Messages | ❌ | ❌ | ✅ |
| Own Profile | ❌ | ✅ | ✅ |
| Settings | ❌ | ✅ | ✅ |

---

## 6. Technical Architecture

### 6.1 Frontend Stack
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with custom design system
- **UI Components:** shadcn/ui (customized)
- **Animations:** Framer Motion
- **State Management:** TanStack React Query
- **Routing:** React Router DOM

### 6.2 Backend (Lovable Cloud)
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth (email/password)
- **Storage:** Supabase Storage (profile photos, post images, chat attachments, intro videos)
- **Real-time:** Supabase Realtime (messages, notifications, profile updates)
- **Edge Functions:** Serverless functions for custom logic

### 6.3 Database Tables
- `profiles` - User profile data
- `posts` - Feed posts
- `post_likes` - Post like relationships
- `post_comments` - Comments with threading support
- `connections` - Connection requests and states
- `messages` - Chat messages
- `education` - User education entries
- `experiences` - User experience entries
- `referrals` - Referral tracking

---

## 7. Design System

### 7.1 Color Theme
- **Primary:** Deep Navy Blue (#1A365D)
- Professional, trust-inspiring aesthetic
- Semantic color tokens for consistency

### 7.2 Typography
- Custom font family (Plus Jakarta Sans)
- Responsive font sizing

### 7.3 Components
- Consistent button variants
- Card-based layouts
- Modal dialogs for editing
- Toast notifications
- Badge indicators

---

## 8. Security Considerations

### 8.1 Data Privacy
- Contact details (email, phone) never exposed to other users
- RLS policies on all database tables
- Secure file storage with access policies

### 8.2 Authentication
- Password-based authentication
- Session management via Supabase Auth
- Protected routes requiring authentication

---

## 9. Future Considerations

- OAuth social login (Google, LinkedIn)
- Advanced matching algorithms
- Premium subscription features
- Mobile app (React Native)
- Analytics dashboard for users
- AI-powered co-founder recommendations

---

## Appendix A: URL Structure

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Landing page | Public |
| `/auth` | Login/Signup | Public |
| `/onboarding` | Profile completion | Authenticated |
| `/feed` | Startup timeline | Authenticated |
| `/discover` | Match/swipe interface | Complete profile |
| `/connections` | Connection management | Complete profile |
| `/messages` | Chat interface | Complete profile |
| `/profile` | Own profile | Authenticated |
| `/profile/:id` | Other user profile | Authenticated |
| `/settings` | Account settings | Authenticated |
| `/contact` | Contact page | Public |
| `/notifications` | Notifications list | Authenticated |

---

*This PRD is maintained as a living document and will be updated as features evolve.*
