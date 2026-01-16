import React, { useEffect, useRef, useState, useCallback } from 'react'

const API_KEY = '577f27c5773b43a9989ec2c7449cbeb7'
const BASE_URL = 'https://api.themoviedb.org/3'
const PLACEHOLDER_POSTER = 'https://placehold.co/500x750/1c1c1c/E50914?text=No+Image'

function debounce(fn, delay) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

export default function App() {
  const [favorites, setFavorites] = useState([])
  const [movies, setMovies] = useState([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [year, setYear] = useState('')
  const [sortBy, setSortBy] = useState('popularity.desc')
  const [genresList, setGenresList] = useState([])
  const [view, setView] = useState('home') // home | favorites | details | error
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [similarMovies, setSimilarMovies] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  // user/login state
  const [user, setUser] = useState(null)
  const [showLogin, setShowLogin] = useState(false)

  const loaderRef = useRef(null)
  const observerRef = useRef(null)

  // localStorage for favorites
  useEffect(() => {
    const saved = localStorage.getItem('movieFavorites')
    if (saved) setFavorites(JSON.parse(saved))
  }, [])

  // load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('movieUser')
    if (savedUser) setUser(JSON.parse(savedUser))
  }, [])

  useEffect(() => {
    localStorage.setItem('movieFavorites', JSON.stringify(favorites))
  }, [favorites])

  const toggleFavorite = (movieId) => {
    setFavorites(prev => {
      if (prev.includes(movieId)) return prev.filter(id => id !== movieId)
      return [...prev, movieId]
    })
  }

  const removeFavoriteAndRefresh = (movieId) => {
    setFavorites(prev => prev.filter(id => id !== movieId))
    // if in favorites view, refresh displayed favorites
    if (view === 'favorites') showFavoritesPage()
  }

  // Fetch genres
  const fetchGenres = useCallback(async () => {
    try {
      const url = `${BASE_URL}/genre/movie/list?api_key=${API_KEY}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch genres')
      const data = await res.json()
      setGenresList(data.genres || [])
    } catch (err) {
      console.error(err)
    }
  }, [])

  // Fetch movies
  const fetchMovies = useCallback(async (pageToFetch = 1) => {
    if (isLoading) return
    setIsLoading(true)
    try {
      let url
      if (query) {
        url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${pageToFetch}`
      } else {
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=${sortBy}&region=IN&page=${pageToFetch}`
        if (genre) url += `&with_genres=${genre}`
        if (year) url += `&primary_release_year=${year}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch movies')
      const data = await res.json()
      if (pageToFetch === 1) setMovies(data.results || [])
      else setMovies(prev => [...prev, ...(data.results || [])])
      setPage(pageToFetch)
    } catch (err) {
      console.error(err)
      setErrorMessage(err.message)
      setView('error')
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, query, genre, year, sortBy])

  // Similar movies
  const fetchSimilarMovies = async (movieId) => {
    try {
      const url = `${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch similar movies')
      const data = await res.json()
      setSimilarMovies(data.results || [])
    } catch (err) {
      console.error(err)
      setSimilarMovies([])
    }
  }

  const showMovieDetails = async (movieId) => {
    try {
      setView('details')
      setSelectedMovie(null)
      const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch movie details')
      const data = await res.json()
      setSelectedMovie(data)
      fetchSimilarMovies(movieId)
      window.scrollTo(0, 0)
    } catch (err) {
      console.error(err)
      setErrorMessage(err.message)
      setView('error')
    }
  }

  const showHomePage = () => {
    setView('home')
    document.title = 'MovieDB - Discover Movies'
  }

  const showFavoritesPage = async () => {
    setView('favorites')
    document.title = 'My Favorites | MovieDB'
  }

  const goBack = () => {
    showHomePage()
  }

  // Login helpers (simple client-side mock)
  const openLogin = () => setShowLogin(true)
  const closeLogin = () => setShowLogin(false)
  const handleLogin = (email, name) => {
    const u = { email, name: name || email.split('@')[0] }
    setUser(u)
    localStorage.setItem('movieUser', JSON.stringify(u))
    setShowLogin(false)
  }
  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('movieUser')
  }

  // reset and fetch page 1
  const resetAndFetch = (opts = {}) => {
    setMovies([])
    fetchMovies(1)
  }

  // infinite scroll setup
  useEffect(() => {
    if (!loaderRef.current) return
    if (observerRef.current) observerRef.current.disconnect()

    const options = { root: null, rootMargin: '0px', threshold: 0.1 }
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoading && view === 'home') {
        fetchMovies(page + 1)
      }
    }, options)
    observerRef.current.observe(loaderRef.current)

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [fetchMovies, isLoading, page, view])

  // initial load
  useEffect(() => {
    fetchGenres()
    resetAndFetch()
  }, [])

  // handlers
  const onSearchChange = (val) => {
    setQuery(val)
    setGenre('')
    setYear('')
    if (val) document.title = `Search: ${val} | MovieDB`
    else document.title = 'MovieDB - Discover Movies'
    resetAndFetch()
  }

  const debouncedSearch = useRef(debounce((v) => onSearchChange(v), 500)).current

  const onGenreChange = (g) => {
    setQuery('')
    setGenre(g)
    resetAndFetch()
  }

  const onYearChange = (y) => {
    setQuery('')
    setYear(y)
    if (y.length === 4 || y.length === 0) resetAndFetch()
  }

  const onSortChange = (s) => {
    setQuery('')
    setSortBy(s)
    resetAndFetch()
  }

  // favorites detail fetch
  const [favoriteDetails, setFavoriteDetails] = useState([])
  useEffect(() => {
    if (view !== 'favorites') return
    if (favorites.length === 0) {
      setFavoriteDetails([])
      return
    }
    let mounted = true
    ;(async () => {
      try {
        const details = await Promise.all(favorites.map(async id => {
          const url = `${BASE_URL}/movie/${id}?api_key=${API_KEY}`
          const res = await fetch(url)
          return res.ok ? res.json() : null
        }))
        if (mounted) setFavoriteDetails(details.filter(Boolean))
      } catch (err) {
        console.error(err)
      }
    })()
    return () => { mounted = false }
  }, [view, favorites])

  // Render helpers
  const MovieCard = ({ movie, showRemove }) => {
    if (!movie || !movie.poster_path) return null
    const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A'
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'
    return (
      <div className="movie-card">
        <div onClick={() => showMovieDetails(movie.id)} style={{cursor: 'pointer'}}>
          <div className="rating-badge">⭐ {rating}</div>
          <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={`${movie.title} poster`} onError={(e)=>{e.currentTarget.src=PLACEHOLDER_POSTER}} />
          <div className="movie-card-info">
            <h3>{movie.title}</h3>
            <p>{releaseYear}</p>
          </div>
        </div>
        {showRemove && <button className="remove-button" onClick={() => removeFavoriteAndRefresh(movie.id)}>Remove</button>}
      </div>
    )
  }

  return (
    <div>
      <header className="main-header">
        <div className="container">
          <a href="#" className="logo" onClick={(e)=>{e.preventDefault(); showHomePage()}}>Movie Discovery</a>
          <nav className="main-nav">
            <a href="#" onClick={(e)=>{e.preventDefault(); showHomePage()}}>Home</a>
            <a href="#" onClick={(e)=>{e.preventDefault(); showFavoritesPage()}}>My Favorites</a>
          </nav>
          <div className="user-area">
            {user ? (
              <>
                <span className="user-greeting">Hi, {user.name}</span>
                <button className="login-button" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <button className="login-button" onClick={openLogin}>Login</button>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        {view === 'home' && (
          <section id="movie-grid-section">
            <div className="hero">
              <h1>Welcome to MovieDB</h1>
              <p>Discover millions of movies. Explore now.</p>
            </div>

            <div className="controls-bar">
              <div className="search-container">
                <input id="searchInput" type="text" placeholder="Search for any movie..." onChange={(e)=>debouncedSearch(e.target.value)} />
              </div>
              <div className="filter-sort-container">
                <select id="genre-filter" value={genre} onChange={(e)=>onGenreChange(e.target.value)}>
                  <option value="">All Genres</option>
                  {genresList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <input id="year-filter" type="number" placeholder="Year" min="1900" max="2099" value={year} onChange={(e)=>onYearChange(e.target.value)} />
                <select id="sort-by" value={sortBy} onChange={(e)=>onSortChange(e.target.value)}>
                  <option value="popularity.desc">Most Popular</option>
                  <option value="release_date.desc">Newest</option>
                  <option value="vote_average.desc">Top Rated</option>
                </select>
              </div>
            </div>

            <h2 id="page-title">Discover Movies</h2>
            <div id="movie-grid" className="movie-grid">
              {movies.length === 0 && !isLoading ? (
                <div id="empty-state" className="hidden" style={{display: 'block'}}>
                  <p>No movies found. Try a different search or filter.</p>
                </div>
              ) : (
                movies.map(m => <MovieCard key={m.id} movie={m} />)
              )}
            </div>

            <div id="loader" ref={loaderRef} className={isLoading ? 'visible' : ''}></div>
          </section>
        )}

        {view === 'favorites' && (
          <section id="favorites-section">
            <h2 id="favorites-title">My Favorite Movies</h2>
            <div id="favorites-grid" className="movie-grid">
              {favoriteDetails.length === 0 ? (
                <p>You haven't added any favorite movies yet.</p>
              ) : (
                favoriteDetails.map(m => <MovieCard key={m.id} movie={m} showRemove={true} />)
              )}
            </div>
          </section>
        )}

        {view === 'details' && selectedMovie && (
          <section id="movie-details-section">
            <div id="movie-detail-content">
              <div className="movie-detail-card">
                <img className="movie-detail-poster" src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`} alt={`${selectedMovie.title} poster`} onError={(e)=>{e.currentTarget.src='https://placehold.co/300x450/1c1c1c/E50914?text=No+Poster'}} />
                <div className="movie-detail-info">
                  <h2>{selectedMovie.title}</h2>
                  <div className="movie-detail-meta">
                    <span>⭐ {selectedMovie.vote_average ? selectedMovie.vote_average.toFixed(1) : 'N/A'} / 10</span>
                    <span>•</span>
                    <span>{selectedMovie.runtime ? Math.floor(selectedMovie.runtime/60)+'h '+(selectedMovie.runtime%60)+'m' : 'N/A'}</span>
                    <span>•</span>
                    <span>{selectedMovie.release_date ? selectedMovie.release_date.split('-')[0] : 'N/A'}</span>
                  </div>
                  <div className="genres-container">
                    {selectedMovie.genres && selectedMovie.genres.map(g => <span key={g.id} className="genre-tag">{g.name}</span>)}
                  </div>
                  <p>{selectedMovie.overview}</p>
                  <button className={`favorite-button ${favorites.includes(selectedMovie.id) ? 'is-favorite' : ''}`} onClick={()=>toggleFavorite(selectedMovie.id)}>
                    {favorites.includes(selectedMovie.id) ? '💔 Remove from Favorites' : '❤️ Add to Favorites'}
                  </button>
                  <button className="back-button" onClick={goBack}>Back to List</button>
                </div>
              </div>
            </div>

            <div id="similar-movies-container">
              {similarMovies.length > 0 && (
                <>
                  <h2 className="similar-movies-title">Similar Movies</h2>
                  <div id="similar-movies-grid" className="movie-grid">
                    {similarMovies.map(m => <MovieCard key={m.id} movie={m} />)}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {view === 'error' && (
          <section id="error-section">
            <div className="error-message">
              <h2>Oops! Something went wrong.</h2>
              <p id="error-text">{errorMessage || 'Could not fetch data. Please check your connection and try again.'}</p>
              <button className="back-button" onClick={()=>{setView('home'); resetAndFetch();}}>Retry</button>
            </div>
          </section>
        )}

      </main>

      <footer className="main-footer">
        <div className="container">
          <p>Powered by <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDb</a></p>
        </div>
      </footer>
      {showLogin && (
        <div className="modal-backdrop" onClick={closeLogin}>
          <div className="login-modal" onClick={(e)=>e.stopPropagation()}>
            <h3>Sign in</h3>
            <LoginForm onCancel={closeLogin} onSubmit={handleLogin} />
          </div>
        </div>
      )}
    </div>
  )
}

function LoginForm({ onCancel, onSubmit }){
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  return (
    <div>
      <label style={{display:'block', marginBottom:8}}>Email</label>
      <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} style={{width:'100%', padding:8, marginBottom:12}} />
      <label style={{display:'block', marginBottom:8}}>Display name (optional)</label>
      <input value={name} onChange={(e)=>setName(e.target.value)} style={{width:'100%', padding:8, marginBottom:12}} />
      <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
        <button className="back-button" onClick={onCancel}>Cancel</button>
        <button className="favorite-button" onClick={()=>onSubmit(email, name)} disabled={!email}>Sign in</button>
      </div>
    </div>
  )
}
