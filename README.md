# MovieDB - A Movie Discovery Web Application

This is a responsive single-page "Movie Discovery" application built with vanilla HTML, CSS, and JavaScript. It integrates with the TMDb API to allow users to discover, search, filter, and save their favorite movies. This project was built as a design assessment for Zephvion.

Live Demo URL: [Paste your live URL from Netlify here]

---

## ✨ Features Implemented

- **Dynamic Home Page**: Displays a grid of trending and popular movies from the TMDb API, localized for the Indian region.

- **Infinite Scroll**: More movies are loaded automatically as the user scrolls, providing a seamless browsing experience.

- **Debounced Search**: A real-time search bar that waits for the user to stop typing (500ms debounce) before fetching results to minimize API calls.

- **Advanced Filtering & Sorting**: Users can filter the movie list by genre and release year, and sort the results by popularity, release date, or top rating.

- **Complete Movie Details**: Clicking a movie opens a detailed view with its poster, overview, runtime, genres, rating, and a grid of similar movie recommendations.

- **Persistent Favorites System**: Users can add and remove movies from a personal "My Favorites" list. Selections are saved to localStorage and persist across browser sessions.

- **Robust Error Handling**: The UI displays a clear, user-friendly error message with a retry option if an API call fails due to network issues.

- **Empty State UI**: A message is shown when a search or filter combination returns no results.

- **Responsive & Modern Design**: The application features a sleek, dark, cinematic theme that is fully responsive and looks great on mobile, tablet, and desktop screens.

- **Accessibility**: Built with semantic HTML, proper focus states for interactive elements, and alt text for images. The browser tab title also updates dynamically as the user navigates the app.

---

## 🛠️ Tech Stack

- **Core**: HTML5, CSS3, JavaScript (ES6+)  
- **API**: TMDb (The Movie Database) API for all movie data.

---

## ⚙️ Setup and Installation

To run this project locally, no complex build steps are needed.

1. Clone the repository or download the source files.  

2. **Get a TMDb API Key**:  
   - Sign up for a free account at [themoviedb.org](https://www.themoviedb.org).  
   - Request an API key (v3 auth) from your account's API settings page.  

3. **Add the API Key**:  
   - Open the `app.js` file.  
   - Find the line  
     ```js
     const API_KEY = '577f27c5773b43a9989ec2c7449cbeb7';
     ```  
     and replace the placeholder with your own key.  

4. **Run the application**:  
   - Simply open the `index.html` file in your web browser.  
   - Using a live server extension in your code editor is recommended for development.  

---

## 🎯 Project Limitations

- **Client-Side API Key**: For this project, the TMDb API key is stored on the client side. For a production-level application, this key would be hidden behind a server-side proxy or a serverless function to ensure it is not publicly exposed.

- **No Build Step**: The project uses vanilla JavaScript without a build process, which simplifies setup but means there is no code minification or bundling for production optimization.

---

## 🔁 Converted to Vite + React

This repository has been converted to a React + Vite app while preserving the original UI and behavior.

To run the React app locally (Windows PowerShell):

```powershell
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173) in your browser.

Notes:
- The TMDb API key is still included client-side as in the original. For production move it to a backend or a serverless proxy.
- Source files for React live in `src/` (entry: `src/main.jsx`, app: `src/App.jsx`, styles: `src/styles.css`).
