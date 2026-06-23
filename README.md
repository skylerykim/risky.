# risky.

Our adventures, mapped. A private, dark-themed app for two people to drop
photo memories on a map, edit those photos, and see how far apart you are
right now.

Built with Next.js + Supabase, deploys free on Vercel.

## What it does

- A dark map (pink + purple "risky" theme) with a pin for every memory
- Tap "New memory" to add photos at your current spot or any spot you tap
- Edit photos like a real photo app: brightness, contrast, saturation,
  warmth, black & white, blur, plus one-tap presets
- Open a pin to see the photo collage and re-edit any photo anytime
- A live "how far apart are we" pill, updated as you both move
- Shared between exactly the two of you, with private photo storage

## One-time setup (about 10 minutes)

You need two free accounts: **Supabase** (the backend) and **Vercel** (hosting).

### 1. Create the Supabase project

1. Go to https://supabase.com and sign up (free).
2. Click **New project**. Name it `risky`, pick a region near you, and set
   a database password (save it somewhere).
3. Wait ~2 minutes for it to finish setting up.

### 2. Create the database

1. In your project, open **SQL Editor** (left sidebar).
2. Click **New query**, then copy-paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
3. You should see "Success". This creates the tables, security rules, the
   private photo storage bucket, and live updates.

### 3. Lock it to just the two of you

1. Open **Authentication -> Sign In / Providers -> Email** and make sure
   **Email** is enabled (it is by default). Magic links work out of the box.
2. After you and your girlfriend have both signed in once (step 6), come
   back to **Authentication -> Sign In / Providers** and turn **OFF**
   "Allow new users to sign up". Now only the two of you can ever log in.

### 4. Get your keys

1. Open **Project Settings -> API**.
2. Copy the **Project URL** and the **anon public** key.
3. In the `risky` folder, copy `.env.local.example` to `.env.local` and
   paste them in:

```
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Run it on your computer

```
npm install
npm run dev
```

Open http://localhost:3000. Enter your name + email, get the magic link in
your inbox, tap it, and you're in. Allow location when the browser asks.

### 6. Put it online (Vercel)

1. Push this folder to your GitHub repo `skylerykim/risky.` (already wired
   up as the `origin` remote).
2. Go to https://vercel.com, sign up, click **Add New -> Project**, and
   import the `risky.` repo.
3. Under **Environment Variables**, add the same three values from your
   `.env.local`, but set `NEXT_PUBLIC_SITE_URL` to your Vercel URL
   (e.g. `https://risky.vercel.app`). You can update it after the first
   deploy once you know the URL.
4. Click **Deploy**.
5. In Supabase, open **Authentication -> URL Configuration** and add your
   Vercel URL to **Site URL** and **Redirect URLs** (add
   `https://your-app.vercel.app/auth/callback`).

### 7. Install on your phones

Open the Vercel link on each phone and "Add to Home Screen". It opens
full-screen like a real app, right to the map.

## How the two of you get paired

There's no pairing step. Because sign-ups are closed (step 3), only the two
accounts that exist can log in, and the app treats it as one shared space:
you both see all memories, and the distance pill measures between your two
phones. Keep the link private.

## Notes

- Photos are stored in a **private** Supabase bucket; the app generates
  short-lived signed links to show them. They are not publicly accessible.
- Photo edits are non-destructive (saved as adjustment values), so the
  original photo is always preserved and you can re-edit forever.
- Location updates roughly every 15 seconds while the app is open.
