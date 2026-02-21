# StudyNest 🎓

StudyNest is an AI-powered academic platform designed to optimize learning for students and provide powerful management tools for teachers. It combines productivity tracking with generative AI to create a personalized educational experience.

## 🚀 Core Features

### For Students

- **AI Study Coach**: 
  - **Personalized Planner**: Generates custom study roadmaps based on self-assessments, learning styles, and real focus data.
  - **Assignment Analysis**: Provides deep, rubric-based feedback on written work to help improve academic performance.
- **Focus Mode**: 
  - **Custom Timers**: Pomodoro and custom focus/break cycles.
  - **Strict Mode**: A dedicated focus environment that locks out distractions and logs interruptions.
- **Scholar Level System**: Gamified progression where students earn XP and levels (e.g., Novice Scholar to Elite Polymath) based on study consistency and focus hours.
- **Study Groups**: 
  - Join or create groups with unique IDs.
  - **Real-time Chat**: Coordinate with peers.
  - **Weekly Leaderboard**: Compete for top focus rankings within your circle.
- **Visual Themes**: Choose from several study environments including *Midnight Scholar*, *Forest Library*, and *Sunrise Focus*.

### For Teachers

- **Classroom Overview**: Monitor total student engagement and shared resource usage.
- **Student Roster**: Track individual student performance, focus trends, and their latest AI-generated study plans.
- **Curriculum Management**: Organize subjects and upload educational materials (PDFs, Videos, Notes) directly to folders accessible by all students.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Firebase Authentication)
- **AI Engine**: [Genkit](https://js.sigmacomputing.com/genkit/) powered by Google Gemini 2.5 Flash
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)

---

## 🏗️ Getting Started

### Prerequisites

- Node.js (Latest LTS)
- A Firebase Project

### Development

1. **Initialize Firebase**:
   Configure your environment variables in `.env` with your Firebase project credentials.

2. **Run the App**:
   ```bash
   npm install
   npm run dev
   ```

3. **Run Genkit (AI Development)**:
   ```bash
   npm run genkit:dev
   ```

## 🔒 Security & Roles

The platform implements robust Firestore Security Rules to ensure:
- Students can only manage their own focus data and study plans.
- Teachers have exclusive permissions to create curriculum subjects and upload materials.
- Group chat privacy is maintained through member-only access rules.

---

Built with ❤️ using Firebase Studio.