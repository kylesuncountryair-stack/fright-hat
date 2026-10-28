# Fright Hat

A phone-friendly site for movie night: everyone picks 5 horror movies, the picks go into a hat, and you draw from the hat. A movie picked by two people gets two tickets, so it has better odds.

## Deploy (about 10 minutes)

### 1. Put the code on GitHub
1. Go to https://github.com/new, name the repo `fright-hat`, and click **Create repository**.
2. On the next page, click **uploading an existing file**.
3. Drag **everything inside** this `fright-hat` folder (the `api`, `lib` and `public` folders plus `package.json`, `README.md`, `dev-server.js`) into the browser, then click **Commit changes**.

### 2. Deploy on Vercel
1. Go to https://vercel.com/new and sign in with GitHub.
2. Import the `fright-hat` repo. Leave every setting as it is and click **Deploy**.

### 3. Add the database (so picks are saved and shared)
1. In your Vercel project, open the **Storage** tab → **Create Database** → choose **Upstash for Redis** (free plan) → connect it to the project.
2. Go to **Deployments**, open the ⋯ menu on the latest one, and click **Redeploy**.

Until you do this, the site shows a "Test mode" banner and picks won't stick.

### 4. Share the link
Send your `https://fright-hat-xxxx.vercel.app` link to the group. Everyone enters their name, picks 5, and taps **Into the hat**. When you draw, the reveal plays on every phone that has the site open.

## Using it
- **Add movies**: tap **+ Add a movie** at the end of the list and search a title or a whole series (like "Leprechaun"). Tick every movie you want and tap **Add**. New movies are not put in anyone's picks automatically.
- **Wrong or missing poster**: tap **Edit list** → **Poster** on that movie. Try the search again or paste an image link.
- **Remove a movie**: **Edit list** → **Remove** (tap twice to confirm).
- **Next movie**: tap **Draw another**. Movies already drawn stay out of the hat.
- **Change the whole list**: edit the list in `lib/data.js`, raise `SEED_VERSION` by 1, and upload the file to GitHub again. The site swaps in the new list on its next deploy.
- **Next date night**: on The Hat tab, tap **New movie night** to clear all picks.

## Better posters (optional)
Posters come from Wikipedia and iTunes by default, with no setup. For the most accurate results, get a free API key from https://www.themoviedb.org/settings/api and add it in Vercel → **Settings** → **Environment Variables** as `TMDB_API_KEY`, then redeploy.

## Run it on your computer (optional)
```
npm run dev
```
Then open http://localhost:3000. With no database connected, it keeps picks in memory.
