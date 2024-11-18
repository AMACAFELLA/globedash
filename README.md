# Globe Dash 🌍🚀

## Overview

Globe Dash is an immersive, location discovery educational 3D game that challenges players to explore, learn, and navigate the world through an engaging, interactive experience.
![Game Logo/Screenshot](globe.svg)

## 🌟 Overview

Globe Dash transforms geographical exploration into a thrilling game, leveraging Google's Photorealistic 3D Maps to create an educational and entertaining adventure. Test your geographical knowledge, spatial awareness, and navigation skills across various difficulty levels.

## 🚀 Features

- **Immersive 3D Exploration**: Navigate photorealistic global landscapes

- **Educational Gameplay**: Learn about diverse locations worldwide

- **Multiple Game Modes**:

  - Easy
  - Normal
  - Hard

- **Dynamic Scoring System**: Points based on accuracy and speed

- **Rich Multimedia Experience**:
  - Sound effects
  - Background music
  - Visual feedback
- **Accessibility**: Inclusive design considerations such as high contrast and colorblindness options.

- **AI Integration**: Generative AI for dynamic location discovery

## 🛠 Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS

### APIs & Libraries

- Google Maps JavaScript API
- Firebase Authentication
- Google Generative AI
- React Router
- Howler.js (Audio)
- React Hot Toast
- Seedrandom for consistent randomization

### Backend & Infrastructure

- Firebase Authentication
- Firestore Database
- Real-time Data Management

### Development Tools

- ESLint
- PostCSS
- Autoprefixer

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm or yarn
- Google Maps API Key
- Firebase Project

### Installation

1. Clone the repository

```bash
git clone https://github.com/AMACAFELLA/globedash

cd globedash
```

2. Install dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Google Maps
VITE_MAPS_API_KEY=your_google_maps_api_key
# Google AI
VITE_GOOGLE_AI_KEY=your_gemini_api_key
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### 4. Run the project

```bash
pnpm run dev
```

Navigate to `http://localhost:5173`

## 🧩 Key Components

### Map Interaction

- Custom 3D map rendering
- Polygon-based gameplay areas
- Dynamic camera controls

### Game Mechanics

- Procedural world generation
- AI generated locations
- Difficulty-based gameplay

## 🔒 Security Considerations

- API key protection
- Environment variable management
- Client-side input validation
- Secure Firebase authentication

## 🎨 Styling

Utilizes Tailwind CSS with custom utilities:

- Responsive design
- Grid backgrounds
- Animated interactions
- Accessibility-focused styles

## 🔍 Performance Optimization

- Lazy loading of Google Maps API
- Code splitting
- Minimal bundle size
- Efficient rendering strategies

## 📊 Roadmap

- [ Multiplayer Mode ] Introduce a cooperative multiplayer mode where players can play against playersa around the world or against their friends.
- [ Custom Game Modes ] Develop tailored game modes for educators or players who want to focus soley on one country, city, or region. This will enhance the educational aspect of the game.
- [ Weekly Challenges and Customization ] Plan to introduce weekly challenges to keep the game fresh and exciting. As well as add player customization, which could range from adding your country flag on the leaderboard, achievement title and more.

## 🐛 Known Issues

- Initial map loading might be slow
- Some browsers may have compatibility limitations
- Performance varies with device capabilities

## 🙏 Acknowledgements

- Google Maps Platform
- Firebase

**Happy Exploring! 🌍🚀**
