import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { getGame } from '../games/registry';
import pixelPlaygroundLogo from '../assets/pixel-playground-logo.svg';

const STATUS_COLORS: Record<string, string> = {
  connecting: '#f59e0b',
  connected: '#10b981',
  reconnecting: '#f59e0b',
  offline: '#ef4444',
};

const STATUS_TEXT: Record<string, string> = {
  connecting: 'Connecting...',
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
  offline: 'Offline',
};

type ThemePalette = {
  name: string;
  bg: string;
  accent: string;
  accent2: string;
  textOnAccent: string;
};

const THEME_KEY = 'pp.theme.v1';
const THEME_PALETTES: Record<string, ThemePalette> = {
  pixelPop: { name: 'Pixel Pop', bg: 'linear-gradient(135deg, #6D7DFF 0%, #9E5BFF 100%)', accent: '#6D7DFF', accent2: '#9E5BFF', textOnAccent: '#ffffff' },
  mintBlast: { name: 'Mint Blast', bg: 'linear-gradient(135deg, #00C9A7 0%, #00B4D8 100%)', accent: '#00A896', accent2: '#00B4D8', textOnAccent: '#ffffff' },
  sunsetArcade: { name: 'Sunset Arcade', bg: 'linear-gradient(135deg, #FF7A59 0%, #FF4D8D 100%)', accent: '#FF5A5F', accent2: '#FF4D8D', textOnAccent: '#ffffff' },
  nightNeon: { name: 'Night Neon', bg: 'linear-gradient(135deg, #111827 0%, #312E81 100%)', accent: '#4F46E5', accent2: '#7C3AED', textOnAccent: '#ffffff' },
};

type RulesInfo = {
  howToPlay: string;
  scoring: string;
  gameEnd: string;
  differences?: string;
};

const GAME_RULES: Record<string, RulesInfo> = {
  tictactoe: {
    howToPlay: 'Take turns placing your mark on a 3x3 grid. Make a line of 3 horizontally, vertically, or diagonally.',
    scoring: 'Win = 1 win, draw = 1 draw, loss = 1 loss in your room stats.',
    gameEnd: 'Ends when someone gets 3 in a row or all cells are filled.',
    differences: 'Very close to classic Tic-Tac-Toe.',
  },
  'tictactoe-3piece': {
    howToPlay: 'Each player only has 3 pieces and repositions them after placing all 3.',
    scoring: 'Win/draw/loss tracked in room stats.',
    gameEnd: 'Ends when someone forms a 3-in-a-row pattern.',
    differences: 'Unlike classic Tic-Tac-Toe, pieces can move once all are placed.',
  },
  hangman: {
    howToPlay: 'Players take turns guessing one letter of a hidden word.',
    scoring: 'Co-op objective: reveal the full word before max wrong guesses.',
    gameEnd: 'Ends when the word is solved or wrong guesses reach the limit.',
    differences: 'Multiplayer co-op turn passing compared with solo classic Hangman.',
  },
  chess: {
    howToPlay: 'Standard chess movement rules by piece type.',
    scoring: 'Win/loss result only (no piece points shown).',
    gameEnd: 'Checkmate, draw condition, or resignation/timeout if implemented.',
    differences: 'Digital room + reconnect flow.',
  },
  rockpaperscissors: {
    howToPlay: 'Both players choose rock, paper, or scissors each round.',
    scoring: 'Round wins count toward overall result.',
    gameEnd: 'Ends after configured rounds or when win condition is reached.',
    differences: 'Room-based multiplayer flow instead of instant one-off.',
  },
  dotsandboxes: {
    howToPlay: 'Draw lines to complete boxes; completing a box gives another turn.',
    scoring: 'Each completed box = 1 point.',
    gameEnd: 'Ends when all boxes are completed.',
    differences: 'Classic rules with online room play.',
  },
  colorwars: {
    howToPlay: 'Tap your tiles to add dots. Tiles burst at threshold and spread to neighbors.',
    scoring: 'You score by controlling more tiles; elimination wins.',
    gameEnd: 'Ends when one player loses all controlled color tiles (after both started).',
    differences: 'Custom chain-reaction rules inspired by territory/chain games.',
  },
  connectfour: {
    howToPlay: 'Drop pieces into columns and connect 4 in a row.',
    scoring: 'Win/draw/loss tracked in room stats.',
    gameEnd: 'Ends on connect-4 or full board draw.',
    differences: 'Classic rules with room UI.',
  },
  memory: {
    howToPlay: 'Flip two cards each turn and try to find matching pairs.',
    scoring: 'Each pair found adds to your count.',
    gameEnd: 'Ends when all pairs are matched.',
    differences: 'Turn-based multiplayer in shared room.',
  },
  marblesevenodd: {
    howToPlay: 'Players choose hidden marbles and guess odd/even outcomes.',
    scoring: 'Correct outcomes add to your score according to game logic.',
    gameEnd: 'Ends when target score/round condition is met.',
    differences: 'Simplified family-friendly odd/even variant.',
  },
  battleship: {
    howToPlay: 'Place ships, then take turns firing at grid coordinates.',
    scoring: 'Hits sink ships; objective is to sink all opponent ships first.',
    gameEnd: 'Ends when one fleet is fully sunk.',
    differences: 'Classic battleship with simplified room interaction.',
  },
  checkers: {
    howToPlay: 'Move diagonally, capture by jumping, king when reaching far row.',
    scoring: 'No points; first to remove/block opponent wins.',
    gameEnd: 'Ends when one player has no legal moves or no pieces.',
    differences: 'Room-based multiplayer flow.',
  },
  airhockey: {
    howToPlay: 'Choose guard row and shoot row each turn.',
    scoring: 'A shot scores if it does not match opponent guard row. First to target score wins.',
    gameEnd: 'Ends when a player reaches the target goals.',
    differences: 'Custom turn-based strategy version of real-time air hockey.',
  },
  war: {
    howToPlay: 'Each player flips top card each trick; higher rank wins the trick.',
    scoring: 'Each trick won = 1 point.',
    gameEnd: 'Ends when decks are exhausted; most tricks wins.',
    differences: 'Simplified War (no tie-battle stack yet).',
  },
  gofish: {
    howToPlay: 'Ask for a rank you hold. If opponent has it, they must give all cards of that rank; otherwise Go Fish.',
    scoring: 'A book = 4 of the same rank. Each book = 1 point.',
    gameEnd: 'Ends when all books are formed / no playable cards remain.',
    differences: 'Privacy-safe action text and card-visual UI for room play.',
  },
  crazyeights: {
    howToPlay: 'On your turn, play a card matching rank or active suit. 8s are wild and let you choose the next suit.',
    scoring: 'First player to empty their hand wins the round.',
    gameEnd: 'Ends when one player has no cards left.',
    differences: 'Simplified family-friendly Crazy Eights (single-deck, draw-one turn flow).',
  },
};

type StatLine = {
  wins: number;
  draws: number;
  losses: number;
};

type StatsByGame = Record<string, StatLine>;
type StatsByUser = Record<string, StatsByGame>;

const DEFAULT_STATS: StatLine = { wins: 0, draws: 0, losses: 0 };
const STATS_KEY = 'fgp.userStats.v1';

function getStoredStats(): StatsByUser {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? (JSON.parse(raw) as StatsByUser) : {};
  } catch {
    return {};
  }
}

function updateStats(userId: string, gameType: string, updater: (current: StatLine) => StatLine): StatLine {
  const all = getStoredStats();
  const userStats = all[userId] || {};
  const current = userStats[gameType] || DEFAULT_STATS;
  const next = updater(current);

  all[userId] = {
    ...userStats,
    [gameType]: next,
  };

  localStorage.setItem(STATS_KEY, JSON.stringify(all));
  return next;
}

function getStatsForGame(userId: string, gameType: string): StatLine {
  const all = getStoredStats();
  return all[userId]?.[gameType] || DEFAULT_STATS;
}

export default function Room() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem('userId') || '';
  const [showCopied, setShowCopied] = useState(false);
  const [showShareQr, setShowShareQr] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [themeKey, setThemeKey] = useState<string>(() => localStorage.getItem(THEME_KEY) || 'pixelPop');
  const [gameStats, setGameStats] = useState<StatLine>(DEFAULT_STATS);
  const [lastRecordedRound, setLastRecordedRound] = useState<number>(0);
  const initialGameType = (location.state as { gameType?: string } | null)?.gameType;
  const { connectionState, roomState, gameType: wsGameType, error, sendMessage, reconnect } = useWebSocket(roomCode || '', initialGameType);

  const gameType = useMemo(() => {
    // Priority: 1) location state (from creating room), 2) websocket gameType, 3) roomState gameType
    return initialGameType || wsGameType || roomState?.gameType || '';
  }, [initialGameType, wsGameType, roomState?.gameType]);

  const gameDefinition = useMemo(() => {
    return gameType ? getGame(gameType) : undefined;
  }, [gameType]);

  const rulesInfo = gameType ? GAME_RULES[gameType] : undefined;
  const theme = THEME_PALETTES[themeKey] || THEME_PALETTES.pixelPop;

  const boardThemeStyle = {
    background:
      themeKey === 'nightNeon'
        ? 'linear-gradient(160deg, rgba(2,6,23,0.92) 0%, rgba(30,27,75,0.85) 100%)'
        : `linear-gradient(160deg, rgba(255,255,255,0.92) 0%, ${theme.accent2}22 100%)`,
    border: themeKey === 'nightNeon' ? '2px solid rgba(34,211,238,0.9)' : `2px solid ${theme.accent}66`,
    boxShadow:
      themeKey === 'nightNeon'
        ? '0 0 0 1px rgba(236,72,153,0.55), 0 0 18px rgba(34,211,238,0.65), 0 0 34px rgba(236,72,153,0.45), inset 0 0 20px rgba(34,211,238,0.12)'
        : `0 12px 30px ${theme.accent}33`,
  } as const;

  const roomLink = useMemo(() => {
    if (!roomCode) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/room/${roomCode}`;
  }, [roomCode]);

  const qrCodeUrl = useMemo(() => {
    if (!roomLink) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(roomLink)}`;
  }, [roomLink]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, themeKey);
  }, [themeKey]);

  useEffect(() => {
    if (!userId || !gameType) return;
    setGameStats(getStatsForGame(userId, gameType));
    setLastRecordedRound(0);
  }, [userId, gameType, roomCode]);

  useEffect(() => {
    if (!roomState || !userId || !gameType) return;
    const gameEnded = roomState.status === 'finished' || roomState.status === 'draw';
    if (!gameEnded) return;

    const round = roomState.roundNumber || 1;
    if (round === lastRecordedRound) return;

    const me = roomState.players.find(p => p.userId === userId);
    if (!me) return;

    const nextStats = updateStats(userId, gameType, (current) => {
      if (roomState.status === 'draw') {
        return { ...current, draws: current.draws + 1 };
      }
      const didWin = roomState.winner === me.symbol;
      return didWin
        ? { ...current, wins: current.wins + 1 }
        : { ...current, losses: current.losses + 1 };
    });

    setGameStats(nextStats);
    setLastRecordedRound(round);
  }, [roomState, userId, gameType, lastRecordedRound]);

  const handleMakeMove = (move: unknown) => {
    if (connectionState !== 'connected') return;
    sendMessage({ type: 'make_move', userId, move });
  };

  const handleRestart = () => {
    if (connectionState !== 'connected') return;
    sendMessage({ type: 'restart_game', userId });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode || '');
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const shareRoom = async () => {
    if (!roomLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Pixel Playground room',
          text: `Join my Pixel Playground room (${roomCode})`,
          url: roomLink,
        });
        return;
      } catch {
        // fallback to copy link
      }
    }
    navigator.clipboard.writeText(roomLink);
  };

  const currentPlayer = roomState?.players.find(p => p.userId === userId);
  const currentPlayerSymbol = roomState?.players[roomState?.currentPlayerIndex ?? 0]?.symbol;
  const myTurn = currentPlayer?.symbol === currentPlayerSymbol && roomState?.status === 'active';
  const isWaiting = roomState?.status === 'waiting';
  const isFinished = roomState?.status === 'finished' || roomState?.status === 'draw';

  const statusMessage = () => {
    if (isWaiting) return 'Waiting for opponent...';
    if (roomState?.status === 'active') return myTurn ? 'Your turn!' : "Opponent's turn";
    if (isFinished) {
      if (roomState?.winner) return roomState.winner === currentPlayer?.symbol ? 'You won!' : 'You lost';
      return "It's a draw!";
    }
    return '';
  };

  const GameBoardComponent = gameDefinition?.renderBoard as
    | ((props: {
        state: any;
        myPlayerId: string;
        mySymbol: string;
        onMove: (move: unknown) => void;
        disabled: boolean;
      }) => ReactNode)
    | undefined;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', background: theme.bg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.95)', padding: '15px 25px', borderRadius: '15px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={pixelPlaygroundLogo} alt="Pixel Playground" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
            <div>
              <div style={{ margin: 0, fontSize: '12px', color: theme.accent, fontWeight: 800 }}>PIXEL PLAYGROUND</div>
              <h1 style={{ margin: 0, fontSize: '22px', color: '#333' }}>{gameDefinition?.displayName || 'Game Room'} ✨</h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Room:</span>
            <code onClick={copyRoomCode} style={{ background: '#f0f0f0', padding: '6px 12px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px', color: theme.accent, cursor: 'pointer' }}>
              {roomCode}
            </code>
            {showCopied && <span style={{ color: '#10b981', fontSize: '12px' }}>Code copied!</span>}

            <button onClick={shareRoom} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: theme.accent, color: theme.textOnAccent, fontWeight: 700, cursor: 'pointer' }}>
              Share
            </button>
            <button onClick={() => setShowShareQr((v) => !v)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#334155', fontWeight: 700, cursor: 'pointer' }}>
              QR
            </button>
            <button onClick={() => setShowRules(true)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#334155', fontWeight: 700, cursor: 'pointer' }}>
              ❓ Rules
            </button>
            <button onClick={() => setShowCustomize(true)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#334155', fontWeight: 700, cursor: 'pointer' }}>
              🎨 Customize
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '20px', background: STATUS_COLORS[connectionState] + '20', color: STATUS_COLORS[connectionState], fontSize: '13px', fontWeight: 600 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLORS[connectionState] }} />
            {STATUS_TEXT[connectionState]}
          </div>
          {connectionState === 'offline' && (
            <button onClick={reconnect} style={{ padding: '8px 16px', background: theme.accent, color: theme.textOnAccent, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              Reconnect
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#fff', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', fontWeight: 600, textAlign: 'center' }}>
          {error}
        </div>
      )}

      {showShareQr && roomLink && (
        <div style={{ alignSelf: 'center', background: 'rgba(255,255,255,0.95)', borderRadius: '14px', padding: '14px', marginBottom: '14px', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Scan to join room {roomCode}</div>
          <img src={qrCodeUrl} alt="Room QR code" width={220} height={220} style={{ borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff' }} />
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', wordBreak: 'break-all' }}>{roomLink}</div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '25px' }}>
        {roomState && (
          <div style={{ display: 'flex', gap: '40px', padding: '20px 40px', background: 'rgba(255,255,255,0.95)', borderRadius: '15px', alignItems: 'center' }}>
            {roomState.players.map((p) => (
              <div key={p.userId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: p.connected ? 1 : 0.5 }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', background: p.symbol === 'X' ? '#667eea' : '#764ba2', color: 'white', boxShadow: p.userId === userId ? '0 0 0 4px #ffeb3b' : 'none' }}>
                  {p.symbol}
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{p.displayName}</span>
                <span style={{ fontSize: '12px', color: p.connected ? '#10b981' : '#ef4444' }}>{p.connected ? 'Online' : 'Offline'}</span>
              </div>
            ))}
          </div>
        )}

        {roomState && (
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)', padding: '0 20px', textAlign: 'center' }}>
            {statusMessage()}
          </div>
        )}

        {gameType && (
          <div style={{ display: 'flex', gap: '14px', background: 'rgba(255,255,255,0.92)', borderRadius: '12px', padding: '10px 14px', fontWeight: 700, color: '#333' }}>
            <span>🏆 Wins: {gameStats.wins}</span>
            <span>🤝 Draws: {gameStats.draws}</span>
            <span>📉 Losses: {gameStats.losses}</span>
          </div>
        )}

        {roomState && gameDefinition && GameBoardComponent && (
          <div
            style={{
              ...boardThemeStyle,
              borderRadius: 18,
              padding: 12,
              width: 'min(980px, calc(100vw - 26px))',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <GameBoardComponent
              state={roomState as any}
              myPlayerId={userId}
              mySymbol={currentPlayer?.symbol || ''}
              onMove={handleMakeMove}
              disabled={connectionState !== 'connected'}
            />
          </div>
        )}

        {roomState && !gameDefinition && (
          <div style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.35)', color: '#fff', borderRadius: '12px', padding: '10px 14px', fontWeight: 600 }}>
            This room’s game type could not be loaded. Try returning to the lobby and rejoining.
          </div>
        )}

        {isFinished && (
          <button onClick={handleRestart} style={{ padding: '16px 40px', fontSize: '18px', fontWeight: 600, background: 'white', color: theme.accent, border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}>
            Play Again
          </button>
        )}

        <button onClick={() => navigate('/')} style={{ padding: '12px 30px', fontSize: '14px', fontWeight: 600, background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '20px' }}>
          Leave Room
        </button>
      </div>


      {showCustomize && (
        <div
          onClick={() => setShowCustomize(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(640px, 96vw)', maxHeight: '82vh', overflow: 'auto', background: 'white', borderRadius: 14, padding: 16 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0, color: '#1f2937' }}>🎨 Customize Theme</h3>
              <button onClick={() => setShowCustomize(false)} style={{ border: 'none', background: '#e5e7eb', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              {Object.entries(THEME_PALETTES).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setThemeKey(key)}
                  style={{
                    textAlign: 'left',
                    border: themeKey === key ? `3px solid ${p.accent}` : '1px solid #cbd5e1',
                    borderRadius: 12,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: '#fff',
                    padding: 0,
                  }}
                >
                  <div style={{ height: 66, background: p.bg }} />
                  <div style={{ padding: 10, fontWeight: 700, color: '#334155' }}>{p.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}


      {showRules && (
        <div
          onClick={() => setShowRules(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(760px, 96vw)', maxHeight: '82vh', overflow: 'auto', background: 'white', borderRadius: 14, padding: 16 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0, color: '#1f2937' }}>❓ {gameDefinition?.displayName || 'Game'} Rules</h3>
              <button onClick={() => setShowRules(false)} style={{ border: 'none', background: '#e5e7eb', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}>Close</button>
            </div>
            {rulesInfo ? (
              <div style={{ display: 'grid', gap: 10, color: '#334155' }}>
                <div><strong>How to play:</strong> {rulesInfo.howToPlay}</div>
                <div><strong>How scoring works:</strong> {rulesInfo.scoring}</div>
                <div><strong>When the game ends:</strong> {rulesInfo.gameEnd}</div>
                {rulesInfo.differences && <div><strong>How this version differs:</strong> {rulesInfo.differences}</div>}
              </div>
            ) : (
              <div style={{ color: '#475569' }}>
                Rules for this game are not added yet. Add it in <code>GAME_RULES</code> in <code>Room.tsx</code> so future players can see it.
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
        <img
          src={pixelPlaygroundLogo}
          alt="Pixel Playground"
          style={{
            width: 'min(260px, 70vw)',
            opacity: 0.95,
            filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.25))',
          }}
        />
      </div>

    </div>
  );
}
