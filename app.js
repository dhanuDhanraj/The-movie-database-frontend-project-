const API_KEY = '577f27c5773b43a9989ec2c7449cbeb7';
const BASE_URL = 'https://api.themoviedb.org/3';

let favorites = [];
let currentPage = 1;
let isLoading = false;
let currentQuery = '';
let currentGenre = '';
let currentYear = '';
let currentSortBy = 'popularity.desc';
let observer; 

function saveFavorites() {
    localStorage.setItem('movieFavorites', JSON.stringify(favorites));
}

function loadFavorites() {
    const savedFavorites = localStorage.getItem('movieFavorites');
    if (savedFavorites) {
        favorites = JSON.parse(savedFavorites);
    }
}

function toggleFavorite(movieId) {
    const favoriteButton = document.querySelector(`.favorite-button[onclick="toggleFavorite(${movieId})"]`);
    if (favorites.includes(movieId)) {
        favorites = favorites.filter(id => id !== movieId);
        if (favoriteButton) {
            favoriteButton.textContent = '❤️ Add to Favorites';
            favoriteButton.classList.remove('is-favorite');
        }
    } else {
        favorites.push(movieId);
        if (favoriteButton) {
            favoriteButton.textContent = '💔 Remove from Favorites';
            favoriteButton.classList.add('is-favorite');
        }
    }
    saveFavorites();
}

function removeFavorite(movieId) {
    favorites = favorites.filter(id => id !== movieId);
    saveFavorites();
    showFavoritesPage();
}


function showHomePage() {
    hideError();
    document.title = 'MovieDB - Discover Movies';
    document.getElementById('movie-grid-section').classList.remove('hidden');
    document.getElementById('favorites-section').classList.add('hidden');
    document.getElementById('movie-details-section').classList.add('hidden');
    setupInfiniteScroll();
}

async function showFavoritesPage() {
    if (observer) observer.disconnect();
    hideError();
    document.title = 'My Favorites | MovieDB';
    document.getElementById('movie-grid-section').classList.add('hidden');
    document.getElementById('movie-details-section').classList.add('hidden');
    document.getElementById('favorites-section').classList.remove('hidden');

    const favoritesGrid = document.getElementById('favorites-grid');
    favoritesGrid.innerHTML = '<h2>Loading your favorite movies...</h2>';

    if (favorites.length === 0) {
        favoritesGrid.innerHTML = '<p>You haven\'t added any favorite movies yet.</p>';
        return;
    }

    try {
        const favoriteMovieDetails = await Promise.all(
            favorites.map(async (id) => {
                const url = `${BASE_URL}/movie/${id}?api_key=${API_KEY}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch favorite movie details.');
                return response.json();
            })
        );
        displayFavoriteMovies(favoriteMovieDetails);
    } catch (error) {
        console.error(error);
        showError(error.message);
    }
}

function displayMovies(movies, gridId = 'movie-grid', append = true) {
    const movieGrid = document.getElementById(gridId);
    const emptyState = document.getElementById('empty-state');

    if (!append) {
        movieGrid.innerHTML = '';
    }
    
    if (movies.length === 0 && !append && gridId === 'movie-grid') {
        emptyState.classList.remove('hidden');
    } else if (gridId === 'movie-grid') {
        emptyState.classList.add('hidden');
    }

    movies.forEach(movie => {
        if (!movie.poster_path) return;

        const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

        const movieCardHTML = `
            <div class="movie-card" onclick="showMovieDetails(${movie.id})">
                <div class="rating-badge">⭐ ${rating}</div>
                <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title} poster" onerror="this.src='https://placehold.co/500x750/1c1c1c/E50914?text=No+Image';">
                <div class="movie-card-info">
                    <h3>${movie.title}</h3>
                    <p>${releaseYear}</p>
                </div>
            </div>
        `;
        movieGrid.innerHTML += movieCardHTML;
    });
}

function displayFavoriteMovies(movies) {
    const favoritesGrid = document.getElementById('favorites-grid');
    favoritesGrid.innerHTML = '';

    movies.forEach(movie => {
        if (!movie.poster_path) return;

        const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

        const movieCardHTML = `
            <div class="movie-card">
                <div onclick="showMovieDetails(${movie.id})">
                    <div class="rating-badge">⭐ ${rating}</div>
                    <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title} poster" onerror="this.src='https://placehold.co/500x750/1c1c1c/E50914?text=No+Image';">
                    <div class="movie-card-info">
                        <h3>${movie.title}</h3>
                        <p>${releaseYear}</p>
                    </div>
                </div>
                <button class="remove-button" onclick="removeFavorite(${movie.id})">Remove</button>
            </div>
        `;
        favoritesGrid.innerHTML += movieCardHTML;
    });
}

function goBack() {
    showHomePage();
}


async function fetchMovies(page = 1) {
    if (isLoading) return;
    isLoading = true;
    document.getElementById('loader').classList.add('visible');

    let url;
    if (currentQuery) {
        url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${currentQuery}&page=${page}`;
    } else {
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=${currentSortBy}&region=IN&page=${page}`;
        if (currentGenre) {
            url += `&with_genres=${currentGenre}`;
        }
        if (currentYear) {
            url += `&primary_release_year=${currentYear}`;
        }
    }

    try {
        hideError();
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch movies.');
        const data = await response.json();
        displayMovies(data.results, 'movie-grid', page > 1);
        currentPage = page;
    } catch (error) {
        console.error(error);
        showError(error.message);
    } finally {
        isLoading = false;
        document.getElementById('loader').classList.remove('visible');
    }
}

async function fetchGenres() {
    try {
        const url = `${BASE_URL} /genre/movie/list?api_key=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch genres.');
        const data = await response.json();
        const genreFilter = document.getElementById('genre-filter');
        data.genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            genreFilter.appendChild(option);
        });
    } catch (error) {
        console.error(error);
    }
}

async function fetchSimilarMovies(movieId) {
    try {
        const url = `${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch similar movies.');
        const data = await response.json();
        const similarContainer = document.getElementById('similar-movies-container');
        
        if (data.results && data.results.length > 0) {
            similarContainer.innerHTML = `
                <h2 class="similar-movies-title">Similar Movies</h2>
                <div id="similar-movies-grid" class="movie-grid"></div>
            `;
            displayMovies(data.results, 'similar-movies-grid', false);
        } else {
            similarContainer.innerHTML = '';
        }
    } catch (error) {
        console.error(error);
    }
}

async function showMovieDetails(movieId) {
    if (observer) observer.disconnect();
    hideError();
    
    const detailContent = document.getElementById('movie-detail-content');
    const similarContainer = document.getElementById('similar-movies-container');
    detailContent.innerHTML = '<h2>Loading details...</h2>';
    similarContainer.innerHTML = '';
    
    try {
        const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch movie details.');
        const movie = await response.json();

        document.title = `${movie.title} | MovieDB`;
        document.getElementById('movie-grid-section').classList.add('hidden');
        document.getElementById('favorites-section').classList.add('hidden');
        document.getElementById('movie-details-section').classList.remove('hidden');

        const isFavorite = favorites.includes(movie.id);
        const buttonText = isFavorite ? '💔 Remove from Favorites' : '❤️ Add to Favorites';
        const buttonClass = isFavorite ? 'is-favorite' : '';

        const genresHTML = movie.genres.map(genre => `<span class="genre-tag">${genre.name}</span>`).join('');

        detailContent.innerHTML = `
            <div class="movie-detail-card">
                 <img class="movie-detail-poster" src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title} poster" onerror="this.src='https://placehold.co/300x450/1c1c1c/E50914?text=No+Poster';">
                 <div class="movie-detail-info">
                    <h2>${movie.title}</h2>
                    <div class="movie-detail-meta">
                        <span>⭐ ${movie.vote_average.toFixed(1)} / 10</span>
                        <span>•</span>
                        <span>${formatRuntime(movie.runtime)}</span>
                        <span>•</span>
                        <span>${movie.release_date.split('-')[0]}</span>
                    </div>
                    <div class="genres-container">
                        ${genresHTML}
                    </div>
                    <p>${movie.overview}</p>
                    <button class="favorite-button ${buttonClass}" onclick="toggleFavorite(${movie.id})">${buttonText}</button>
                    <button class="back-button" onclick="goBack()">Back to List</button>
                 </div>
            </div>
        `;
        
        window.scrollTo(0, 0);
        fetchSimilarMovies(movieId);

    } catch (error) {
        console.error(error);
        showError(error.message);
    }
}

function showError(message = "Could not fetch data. Please check your connection and try again.") {
    document.title = 'Error | MovieDB';
    document.getElementById('movie-grid-section').classList.add('hidden');
    document.getElementById('favorites-section').classList.add('hidden');
    document.getElementById('movie-details-section').classList.add('hidden');

    const errorSection = document.getElementById('error-section');
    const errorText = document.getElementById('error-text');
    errorText.textContent = message;
    errorSection.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error-section').classList.add('hidden');
}

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function formatRuntime(minutes) {
    if (typeof minutes !== 'number' || minutes < 0) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

function setupInfiniteScroll() {
    const loader = document.getElementById('loader');
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading) {
            fetchMovies(currentPage + 1);
        }
    }, options);

    if (loader) {
        observer.observe(loader);
    }
}

function resetAndFetch() {
    currentPage = 1;
    document.getElementById('movie-grid').innerHTML = '';
    if (observer) {
        observer.disconnect();
    }
    fetchMovies(1);
    setupInfiniteScroll();
}

document.addEventListener('DOMContentLoaded', () => {
    loadFavorites();
    fetchGenres();
    resetAndFetch();
});

document.getElementById('genre-filter').addEventListener('change', (e) => {
    currentQuery = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('page-title').textContent = e.target.options[e.target.selectedIndex].text + ' Movies';
    if(e.target.value === '') document.getElementById('page-title').textContent = 'Discover Movies';
    currentGenre = e.target.value;
    document.querySelector('.hero').classList.add('hidden');
    resetAndFetch();
});

document.getElementById('year-filter').addEventListener('input', debounce((e) => {
    currentQuery = '';
    document.getElementById('searchInput').value = '';
    const year = e.target.value;
    if (year.length === 4 || year.length === 0) {
        currentYear = year;
        document.querySelector('.hero').classList.add('hidden');
        resetAndFetch();
    }
}, 500));


document.getElementById('sort-by').addEventListener('change', (e) => {
    currentQuery = '';
    document.getElementById('searchInput').value = '';
    currentSortBy = e.target.value;
    document.querySelector('.hero').classList.add('hidden');

    resetAndFetch();
});

const searchInput = document.getElementById('searchInput');
const debouncedSearch = debounce((query) => {
    document.title = query ? `Search: ${query} | MovieDB` : 'MovieDB - Discover Movies';
    currentQuery = query;
    currentGenre = '';
    currentYear = '';
    document.getElementById('genre-filter').value = '';
    document.getElementById('year-filter').value = '';
    document.getElementById('page-title').textContent = query ? `Results for "${query}"` : 'Discover Movies';
    document.querySelector('.hero').classList.add('hidden');
    resetAndFetch();
}, 500);

searchInput.addEventListener('input', (event) => {
    debouncedSearch(event.target.value);
});

