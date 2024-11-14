# Globe Dash

Globe Dash is an educational 3D game that challenges players to navigate historical sites and popular locations around the world, competing against an AI opponent or other players in multiplayer mode.

## Features

- Explore a 3D world using Google's Photorealistic 3D Maps
- Learn about historical sites and popular locations
- Compete against an AI opponent or other players
- Multiple game modes (Easy, Normal, Hard)
- Real-time multiplayer chat
- Sound effects and background music

## Technologies Used

- React
- TypeScript
- Vite
- Google Maps JavaScript API
- Google's Generative AI (Gemini)
- Firebase (Authentication and Firestore)
- Tailwind CSS
- Howler.js (for audio)

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/globe-dash.git
   cd globe-dash
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following variables:
   ```
   VITE_MAPS_API_KEY=your_maps_api_key_here
   VITE_GOOGLE_API_KEY=your_google_api_key_here
   VITE_FIREBASE_API_KEY=your_firebase_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
   VITE_FIREBASE_APP_ID=your_firebase_app_id_here
   VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id_here
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173` to play the game.

## How to Play

1. Start a new game by clicking the "Start Game" button.
2. You'll be shown a location for 5 seconds. Try to remember it!
3. After that, you'll be placed somewhere in the world.
4. Use your mouse to navigate the 3D map.
5. Find and click on the target location as fast as you can.
6. The closer you are and the faster you find it, the more points you'll earn.
7. Compete against the AI opponent or other players in multiplayer mode.
8. Try different game modes for more challenges.
