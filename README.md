# Akashic
### AI-Powered Photo Memory App

Search your photos using natural language. Upload a photo, and Akashic's AI will analyze it — then find it later by searching "sunset at the beach" or "my dog playing outside."

**[Public Documentation](https://docs.google.com/document/d/1wNnEaaiGcxZ6G3pjweAR8vmAk93IGqtH5G9dkC9pots/edit?usp=sharing)**

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native + Expo |
| Styling | NativeWind (Tailwind CSS) |
| Navigation | Expo Router |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL + pgvector) |
| AI | GitHub Models (GPT-4o-mini + text-embedding-3-small) |
| Deployment | Railway |

---

## 📱 Running the App

### Android
Download the latest APK and install it directly on your phone:

> **[App Link](https://expo.dev/artifacts/eas/nD8w2p1RjZFd3QJvYJhK1v.apk)**

- Allow "Install from unknown sources"
- Allow "Access to all media files"

### iOS
Install **Expo Go** from the App Store, then follow the development setup below.

> A native iOS build for direct install (no Expo Go) is coming in a future release.

---

## 🛠 Development Setup

### Prerequisites
- Node.js `v18+`
- Expo Go app (iOS) or Android device/emulator

### 1. Clone the repo
```bash
git clone https://github.com/alxjann/ai-photo
cd ai-photo
git checkout main
```

### 2. Set up Supabase
1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** and run the full schema below (see [Database Setup](#database-setup))
4. Go to **Settings → API** and copy your:
   - Project URL
   - Anon public key

### 3. Get a GitHub Models token
1. Go to [github.com/marketplace/models](https://github.com/marketplace/models)
2. Create a Personal Access Token with Models access
3. Save it — you'll need **two separate tokens** (one for GPT, one for embeddings) to avoid rate limits

### 4. Configure environment variables

Create `backend/.env`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GPT_TOKEN=your_github_token_for_gpt
VECTOR_TOKEN=your_github_token_for_embeddings
PORT=3000
```

Create `frontend/.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Start the backend
```bash
cd backend
npm install
node index.js
```

### 6. Start the frontend
```bash
cd frontend
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS) or your Android camera.


---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/image` | Upload & process a single photo |
| `POST` | `/api/images/batch` | Batch upload photos |
| `POST` | `/api/search` | Search photos by natural language |
| `GET` | `/api/photos` | Get all photos for the authenticated user |
| `GET` | `/api/photo/:id` | Get a single photo |
| `DELETE` | `/api/photo/:id` | Delete a photo |
| `POST` | `/api/photo/:id/reprocess` | Re-run AI analysis on a photo |

All endpoints require `Authorization: Bearer <token>` header.

---

## ❓ Troubleshooting

**App crashes on startup**
- Make sure `frontend/.env` has both Supabase variables set

**"No token provided" error**
- You're not logged in or the session expired — log out and back in

**Upload fails**
- Check Railway logs for the specific error
- Make sure `GPT_TOKEN` and `VECTOR_TOKEN` are set correctly

**Search returns no results**
- Try more specific queries like "sea turtle" instead of "ocean animals"
- Photos processed with old prompts may need re-uploading

**GitHub Models rate limit / hanging requests**
- Use two separate GitHub accounts for `GPT_TOKEN` and `VECTOR_TOKEN` — they have independent quotas

**Not using your own Supabase DB?**
- If you build using EAS, make sure `frontend/eas.json` has your own `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## 👥 Contributors

Built by Alexander Espia and Ralph Morales
