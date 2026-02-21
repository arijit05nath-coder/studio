
# StudyNest 🎓

StudyNest is an AI-powered academic platform designed to optimize learning for students and provide powerful management tools for teachers. It combines productivity tracking with generative AI to create a personalized educational experience.

## 🚀 Core Features

### 🌍 Multilingual Support
- **Full Localization**: StudyNest supports multiple languages including **English, Hindi, Bengali, Tamil, and Malayalam**.
- **Seamless Switching**: Users can change their preferred language directly from the dashboard navigation or landing page.

### For Students
- **AI Study Coach**: 
  - **Personalized Planner**: Generates custom study roadmaps based on self-assessments, learning styles, and real focus data.
  - **Assignment Analysis**: Provides deep, rubric-based feedback on written work to help improve academic performance.
- **Focus Mode**: 
  - **Custom Timers**: Pomodoro and custom focus/break cycles.
  - **Strict Mode**: A dedicated focus environment that locks out distractions and logs interruptions.
- **Scholar Level System**: Gamified progression where students earn XP and levels (e.g., Novice Scholar to Elite Polymath) based on study consistency and focus hours.
- **Study Groups**: Coordinate with peers in real-time and compete on the weekly leaderboard.

### For Teachers
- **Classroom Overview**: Monitor total student engagement and shared resource usage.
- **Student Roster**: Track individual student performance, focus trends, and their latest AI-generated study plans.
- **Curriculum Management**: Organize subjects and upload educational materials (PDFs, Videos, Notes).

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (for Auth and i18n)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Firebase Authentication)
- **AI Engine**: [Genkit](https://js.sigmacomputing.com/genkit/) powered by Google Gemini 2.5 Flash

---

## 🏗️ Getting Started

1. **Initialize Firebase**: Configure your environment variables in `.env`.
2. **Run the App**: `npm install && npm run dev`
3. **Multilingual Settings**: Use the globe icon in the navigation to switch languages.

Built with ❤️ using Firebase Studio.
