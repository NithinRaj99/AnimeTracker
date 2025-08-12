import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MainApp.css';
import { db, ref, push, onValue, remove, logout } from './firebase';
import { update } from 'firebase/database';


function MainApp({ user }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('home'); // default to home
  const [watched, setWatched] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [trending, setTrending] = useState([]);
  const [topAnime, setTopAnime] = useState([]);
  const [homeAnime, setHomeAnime] = useState([]);

  // Fetch user's saved anime
  useEffect(() => {
    const animeRef = ref(db, 'anime/');
    onValue(animeRef, (snapshot) => {
      const data = snapshot.val() || {};
      const allData = Object.entries(data)
        .map(([key, value]) => ({ ...value, key }))
        .filter(item => item.uid === user.uid);
      setWatched(allData.filter(d => d.status === 'watched'));
      setWishlist(allData.filter(d => d.status === 'wishlist'));
    });
  }, [user.uid]);

  // Fetch trending and top anime
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get('https://api.jikan.moe/v4/top/anime?filter=airing');
        setTrending(res.data.data.slice(0, 10));
      } catch (err) {
        console.error('Error fetching trending:', err);
      }
    };

    const fetchTopAnime = async () => {
      try {
        const res = await axios.get('https://api.jikan.moe/v4/top/anime?filter=bypopularity');
        setTopAnime(res.data.data.slice(0, 10));
      } catch (err) {
        console.error('Error fetching top anime:', err);
      }
    };

    fetchTrending();
    fetchTopAnime();
  }, []);

  // Fetch random anime for Home tab
 const fetchRandomHomeAnime = async () => {
    try {
      // Generate a random page number between 1 and 1000
      const randomPage = Math.floor(Math.random() * 1000) + 1;

      console.log(`Fetching random anime from page ${randomPage}...`);

      const res = await axios.get(`https://api.jikan.moe/v4/anime?q=&page=${randomPage}`);

      // Shuffle results and pick 10
      const shuffled = res.data.data.sort(() => 0.5 - Math.random());
      setHomeAnime(shuffled.slice(0, 12));

    } catch (error) {
      console.error("Error fetching home anime:", error);
    }
};

  useEffect(() => {
    fetchRandomHomeAnime();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${query}`);
      setResults(response.data.data);
      console.log(results);
    } catch (error) {
      console.error('Error fetching data:', error);
      setResults([]);
      
    } finally {
      setLoading(false);
    }
  };

  const saveAnime = async (anime, type) => {
    const animeData = {
      id: anime.mal_id,
      title: anime.title_english==null?anime.title:anime.title_english,
      synopsis: anime.synopsis?.substring(0, 200) || 'No description available',
      image: anime.images.jpg.image_url,
      status: type,
      uid: user.uid,
      userEmail: user.email
    };
    try {
      await push(ref(db, 'anime/'), animeData);
    } catch (error) {
      console.error("Failed to save to Firebase:", error);
    }
  };

  const deleteAnime = async (animeKey) => {
    try {
      await remove(ref(db, `anime/${animeKey}`));
    } catch (error) {
      console.error("Failed to delete from Firebase:", error);
    }
  };

  const updateAnimeStatus = async (animeKey, newStatus) => {
    try {
      await update(ref(db, `anime/${animeKey}`), { status: newStatus });
    } catch (error) {
      console.error("Failed to update anime status:", error);
    }
  };

  const isInList = (id, list) => list.some(item => String(item.id) === String(id));
  const renderAnimeList = (list, type) =>
    list.length === 0 ? <p>No data available.</p> : list.map(anime => (
      <div key={anime.key} className="result-item">
        <div className='anime-title'>
        <h3 style={{ color: anime.genres?.[0]?.mal_id==12 ? "red" : "white" }}>{anime.title_english==null?anime.title:anime.title_english}{anime.score!=null?"("+anime.score+")":""}</h3>
        </div>
        <img src={anime.image} alt={anime.title} />
        <div className='anime-synopsis'>
        <p>{anime.synopsis}...</p>
        </div>
        <div className="button-group">
          <button
            onClick={() => {
              const confirmDelete = window.confirm("Are you sure you want to remove this anime?");
              if (confirmDelete) {
                deleteAnime(anime.key);
              }
            }}
          >
            Remove
          </button>
          {type === 'wishlist' && (
            <button onClick={() => updateAnimeStatus(anime.key, 'watched')}>
              Move to Watched
            </button>
          )}
        </div>
      </div>
    ));

  const renderAnimeWithButtons = (list) =>
    list.map((anime) => {
      const isWatched = isInList(anime.mal_id, watched);
      const isWishlisted = isInList(anime.mal_id, wishlist);
      return (
        <div key={anime.mal_id} className="result-item">
          <h3 style={{ color: anime.genres?.[0]?.mal_id==12 ? "red" : "white" }}>
            {anime.title_english==null?anime.title:anime.title_english}{''}
            {isWatched && <span className="badge watched">Watched</span>}
            {isWishlisted && <span className="badge wishlist">Wishlisted</span>}
          </h3>
          <img src={anime.images.jpg.image_url} alt={anime.title} />
          <p>{anime.synopsis?.substring(0, 200) || 'No description available'}...</p>
          <div className="button-group">
            <button
              onClick={() => saveAnime(anime, 'watched')}
              disabled={isWatched}
            >
              {isWatched ? 'Already Watched' : 'Watched'}
            </button>
            <button
              onClick={() => saveAnime(anime, 'wishlist')}
              disabled={isWishlisted}
            >
              {isWishlisted ? 'In Wishlist' : 'Wishlist'}
            </button>
          </div>
        </div>
      );
    });

  // Home cards: no synopsis, just title + image + buttons
  const renderHomeCards = (list) =>
    list.map((anime) => {
      const isWatched = isInList(anime.mal_id, watched);
      const isWishlisted = isInList(anime.mal_id, wishlist);
      return (
        <div key={anime.mal_id} className="result-item">
          <div className='anime-title'>
            
          <h3 style={{ color: anime.genres?.[0]?.mal_id==12 ? "red" : "white" }}>
            {anime.title_english==null?anime.title:anime.title_english}{"("+anime.score+")"}
          </h3>
          </div>
          <img src={anime.images.jpg.image_url} alt={anime.title} />
          <div className="button-group">
            <button
              onClick={() => saveAnime(anime, 'watched')}
              disabled={isWatched}
            >
              {isWatched ? 'Already Watched' : 'Watched'}
            </button>
            <button
              onClick={() => saveAnime(anime, 'wishlist')}
              disabled={isWishlisted}
            >
              {isWishlisted ? 'In Wishlist' : 'Wishlist'}
            </button>
          </div>
        </div>
      );
    });

  return (
    <div className="app-container">
      <div className="header">
        <h1>Anime Tracker</h1>
        <div className="user-info">
          <span className="user-name">{user.displayName || user.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="tabs">
        <button onClick={() => { setTab('home'); fetchRandomHomeAnime(); }}>Home</button>
        <button onClick={() => setTab('search')}>Search</button>
        <button onClick={() => setTab('watched')}>Watched</button>
        <button onClick={() => setTab('wishlist')}>Wishlist</button>
        {/* <button onClick={() => setTab('trending')}>Trending</button> */}
        <button onClick={() => setTab('top')}>Most Watched</button>
      </div>

      {tab === 'home' && (
        <div>
          
          <h2>Recommended Anime</h2>
          <div className='rendering-div'>
          {renderHomeCards(homeAnime)}
          </div>
        </div>
      )}

      {tab === 'search' && (
        <>
          <div className="search-bar">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Anime..."
            />
            <button onClick={handleSearch}>Search</button>
          </div>
          {loading && <p>Loading...</p>}
          <div>
            {results.length === 0 && !loading && <p>No results</p>}
            {renderAnimeWithButtons(results)}
          </div>
        </>
      )}

      {tab === 'watched' && (
        <div>
          <h2>Watched List</h2>
          <div className='rendering-div'>
          {renderAnimeList(watched, 'watched')}
          </div>
        </div>
      )}

      {tab === 'wishlist' && (
        <div>
          <h2>Wishlist</h2>
        <div className='rendering-div'>
          {renderAnimeList(wishlist, 'wishlist')}
        </div>
        </div>
      )}

      {tab === 'trending' && (
        <div>
          <h2>Trending Anime</h2>
          {renderAnimeWithButtons(trending)}
        </div>
      )}

      {tab === 'top' && (
        <div>
          <h2>Most Watched / Popular Anime</h2>
          {renderAnimeWithButtons(topAnime)}
        </div>
      )}
    </div>
  );
}

export default MainApp;
