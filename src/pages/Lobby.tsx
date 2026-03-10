import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGameList } from '../games/registry';
import pixelPlaygroundLogo from '../assets/pixel-playground-logo.svg';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const AVATAR_PACK_1 = [
  'pixel-joystick','pixel-sword','pixel-shield','pixel-dice','pixel-trophy',
  'pixel-rocket','pixel-gamepad','pixel-crown','pixel-ghost','pixel-planet'
];
const AVATAR_PACK_2 = [
  'avatar-robot-blue','avatar-robot-pink','avatar-fox','avatar-panda','avatar-ninja',
  'avatar-astronaut','avatar-wizard','avatar-pixel-girl','avatar-pixel-boy','avatar-alien',
  'avatar-pixel-boy-black','avatar-pixel-girl-black'
];

function avatarSrc(id: string): string {
  return `/avatars/${id}.svg`;
}

const ALL_AVATARS = [...AVATAR_PACK_1, ...AVATAR_PACK_2];

const GAME_EMOJIS: Record<string, string> = {
  tictactoe: '❌⭕',
  'tictactoe-3piece': '🧠❌⭕',
  hangman: '🪢🔤',
  chess: '♟️👑',
  rockpaperscissors: '🪨📄✂️',
  dotsandboxes: '🔵📦',
  colorwars: '🌈⚔️',
  connectfour: '🔴🟡',
  memory: '🧩🧠',
  marblesevenodd: '⚪🔢',
  battleship: '🚢💥',
  checkers: '🔴⚫',
  airhockey: '🏒🥅',
  war: '🃏⚔️',
  gofish: '🐟🃏',
  crazyeights: '8️⃣🃏',
  unolight: '🎴🌈',
  blackjack: '🂡🃏',
  oldmaid: '🃏🧙‍♀️',
  snakesladders: '🐍🪜',
  bingo: '🎯🔢',
  dominoes: '🁢🁫',
  spades: '♠️🃏',
};

function safeGetStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors (e.g., private browsing restrictions)
  }
}

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
}

export default function Lobby() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedGameType, setSelectedGameType] = useState('');
  const [showGameSelect, setShowGameSelect] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const [selectedAvatarId, setSelectedAvatarId] = useState('avatar-robot-blue');

  const games = getGameList();

  useEffect(() => {
    const saved = safeGetStorage('displayName');
    if (saved) setDisplayName(saved);
    if (games.length > 0) {
      setSelectedGameType(games[0].id);
    }
    const savedAvatar = safeGetStorage('avatarId');
    if (savedAvatar) setSelectedAvatarId(savedAvatar);

    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleRandomAvatar = () => {
    const next = ALL_AVATARS[Math.floor(Math.random() * ALL_AVATARS.length)];
    if (next) setSelectedAvatarId(next);
  };

  const handleCreateClick = () => {
    if (!displayName.trim()) {
      alert('Please enter your display name!');
      return;
    }
    setShowGameSelect(true);
  };

  const handleRandomRoom = () => {
    if (!displayName.trim()) {
      alert('Please enter your display name!');
      return;
    }
    if (games.length === 0) return;
    safeSetStorage('displayName', displayName);
    safeSetStorage('avatarId', selectedAvatarId);
    safeSetStorage('userId', safeGetStorage('userId') || crypto.randomUUID());
    const randomGame = games[Math.floor(Math.random() * games.length)].id;
    const roomCode = generateRoomCode();
    navigate(`/room/${roomCode}`, { state: { gameType: randomGame } });
  };

  const handleCreateRoom = (gameId?: string) => {
    safeSetStorage('displayName', displayName);
    safeSetStorage('avatarId', selectedAvatarId);
    safeSetStorage('userId', safeGetStorage('userId') || crypto.randomUUID());
    const roomCode = generateRoomCode();
    navigate(`/room/${roomCode}`, { state: { gameType: gameId || selectedGameType } });
  };

  const handleJoin = () => {
    if (!displayName.trim()) {
      alert('Please enter your display name!');
      return;
    }
    if (!joinCode.trim() || joinCode.length !== 6) {
      alert('Please enter a valid 6-character room code!');
      return;
    }
    safeSetStorage('displayName', displayName);
    safeSetStorage('avatarId', selectedAvatarId);
    safeSetStorage('userId', safeGetStorage('userId') || crypto.randomUUID());
    navigate(`/room/${joinCode.toUpperCase()}`);
  };

  const handleBack = () => {
    setShowGameSelect(false);
  };

  if (showGameSelect) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', background: 'linear-gradient(135deg, #6D7DFF 0%, #9E5BFF 100%)' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '30px', maxWidth: '1280px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '10px', color: '#6D7DFF' }}>🕹️ Select a Pixel Playground Game</h1>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '12px' }}>Tap any tile to instantly create that game room.</p>
          <button onClick={handleRandomRoom} style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 700, background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', marginBottom: '18px' }}>
            🎲 Random Game Room
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))', gap: '16px', marginBottom: '30px' }}>
            {games.map((game) => {
              const emoji = GAME_EMOJIS[game.id] ?? '🎲';
              return (
                <div
                  key={game.id}
                  onClick={() => handleCreateRoom(game.id)}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    border: '2px solid #e0e0e0',
                    background: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{emoji}</div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#222',
                      marginBottom: '6px',
                      lineHeight: 1.25,
                      whiteSpace: 'normal',
                      overflowWrap: 'anywhere',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '48px',
                    }}
                    title={game.displayName}
                  >
                    {game.displayName}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {game.description}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={handleBack} style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 600, background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', background: 'linear-gradient(135deg, #6D7DFF 0%, #9E5BFF 100%)' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '40px', maxWidth: '450px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <img src={pixelPlaygroundLogo} alt="Pixel Playground" style={{ width: '100%', maxHeight: 120, objectFit: 'contain', marginBottom: 8 }} />
        <h1 style={{ textAlign: 'center', width: '100%', margin: '0 auto 10px auto', color: '#7C4DFF', fontFamily: "'Fredoka One', 'Baloo 2', 'Comic Sans MS', 'Trebuchet MS', sans-serif", fontWeight: 900, letterSpacing: '1px', lineHeight: 1.0, textShadow: '-2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff, 2px 2px 0 #ffffff, 0 8px 18px rgba(124,77,255,0.38)' }}><span style={{ display: 'block' }}>✨ Pixel ✨</span><span style={{ display: 'block' }}>Playground</span></h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Play • Create • Challenge</p>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>Your Name</label>
        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Enter your name" style={{ width: '100%', padding: '14px 18px', fontSize: '16px', border: '2px solid #e0e0e0', borderRadius: '12px', marginBottom: '25px', outline: 'none' }} />
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#333' }}>Avatar</label>
        <button onClick={handleRandomAvatar} style={{ width: '100%', padding: '10px', fontSize: '14px', fontWeight: 700, background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', marginBottom: '10px' }}>🎲 Random Avatar</button>
        <div style={{ marginBottom: '18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 10 }}>
          <div style={{ fontSize: 12, color: '#475569', fontWeight: 700, marginBottom: 6 }}>Pixels</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 8 }}>
            {AVATAR_PACK_1.map((id) => (
              <button key={id} onClick={() => setSelectedAvatarId(id)} style={{ border: selectedAvatarId === id ? '2px solid #6D7DFF' : '1px solid #cbd5e1', borderRadius: 8, padding: 2, background: '#fff', cursor: 'pointer' }}>
                <img src={avatarSrc(id)} alt={id} style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 6 }} />
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#475569', fontWeight: 700, marginBottom: 6 }}>Characters</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {AVATAR_PACK_2.map((id) => (
              <button key={id} onClick={() => setSelectedAvatarId(id)} style={{ border: selectedAvatarId === id ? '2px solid #6D7DFF' : '1px solid #cbd5e1', borderRadius: 8, padding: 2, background: '#fff', cursor: 'pointer' }}>
                <img src={avatarSrc(id)} alt={id} style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 6 }} />
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleCreateClick} style={{ width: '100%', padding: '16px', fontSize: '18px', fontWeight: 600, background: 'linear-gradient(135deg, #6D7DFF 0%, #9E5BFF 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', marginBottom: '20px' }}>
          Create New Room
        </button>
        <div style={{ textAlign: 'center', margin: '20px 0', color: '#999', position: 'relative' }}>
          <span style={{ background: 'white', padding: '0 15px', position: 'relative', zIndex: 1 }}>OR</span>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#e0e0e0', zIndex: 0 }}></div>
        </div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>Room Code</label>
        <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter 6-character code" maxLength={6} style={{ width: '100%', padding: '14px 18px', fontSize: '16px', border: '2px solid #e0e0e0', borderRadius: '12px', marginBottom: '15px', textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold', outline: 'none' }} />
        <button onClick={handleJoin} style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 600, background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
          Join Room
        </button>
      </div>
    </div>
  );
}
