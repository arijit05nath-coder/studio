# **App Name**: FocusFlow

## Core Features:

- Authentication: Secure user authentication with Firebase, supporting email/password login and role selection (student/teacher).
- Role-Based Dashboards: Dynamic routing to student or teacher dashboards based on user role. Firestore security rules enforce role-based access.
- Material Upload System: Teachers can upload study materials (PDFs, links, notes) organized by subject/topic, stored in Firebase Storage with metadata in Firestore.
- Focus Mode (Pomodoro & Custom): Students can engage in Pomodoro or custom timer focus sessions, tracked with progress bars and session logging.
- Strict Focus Mode: An enhanced focus mode that locks in-app navigation and other sections, logging interruptions and session completions.
- Group Study: Students create/join groups with shared progress dashboards and basic chat for collaborative learning. Teachers can optionally monitor group activity.
- AI-Powered Study Tool: LLM tool analyzes performance trends to make personalized study recommendations.

## Style Guidelines:

- Primary color: Soft lavender (#E6E6FA) to promote a calming and student-friendly environment.
- Background color: Very light lavender (#F5F5FF) to offer a gentle contrast and minimize distractions.
- Accent color: Light teal (#A0D6B4) to add a touch of freshness and highlight key interactive elements.
- Body and headline font: 'PT Sans' for readability and a modern yet warm feel.
- Simple, clean icons to represent actions and categories within the app. All icons to be filled rather than outlined, for improved legibility.
- Mobile-first responsive design with rounded components to maintain a consistent and accessible user experience across devices.
- Subtle progress bar animations and smooth transitions to provide visual feedback during focus sessions.