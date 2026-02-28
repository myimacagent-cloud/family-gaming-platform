import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

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

  useEffect(() => {
    const saved = localStorage.getItem('displayName');
    if (saved) setDisplayName(saved);
  }, []);

  const handleCreate = () => {
    if (!displayName.trim()) {
      alert('Please enter your display name!');
      return;
    }
    localStorage.setItem('displayName', displayName);
    localStorage.setItem('userId', localStorage.getItem('userId') || crypto.randomUUID());
    const roomCode = generateRoomCode();
    navigate(`/room/${roomCode}`);
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
    localStorage.setItem('displayName', displayName);
    localStorage.setItem('userId', localStorage.getItem('userId') || crypto.randomUUID());
    navigate(`/room/${joinCode.toUpperCase()}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px', color: '#667eea' }}>🎮 Family Tic-Tac-Toe</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Play together, anywhere!</p>

        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
          Your Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your name"
          style={{
            width: '100%',
            padding: '14px 18px',
            fontSize: '16px',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            marginBottom: '25px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
        />

        <button
          onClick={handleCreate}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '18px',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            marginBottom: '20px',
            transition: 'transform 0.1s, box-shadow 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Create New Room
        </button>

        <div style={{ textAlign: 'center', margin: '20px 0', color: '#999', position: 'relative' }}>
          <span style={{ background: 'white', padding: '0 15px', position: 'relative', zIndex: 1 }}>OR</span>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#e0e0e0', zIndex: 0 }}></div>
        </div>

        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
          Room Code
        </label>
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="Enter 6-character code"
          maxLength={6}
          style={{
            width: '100%',
            padding: '14px 18px',
            fontSize: '16px',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            marginBottom: '15px',
            textAlign: 'center',
            letterSpacing: '4px',
            fontWeight: 'bold',
            outline: 'none'
          }}
        />

        <button
          onClick={handleJoin}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '16px',
            fontWeight: 600,
            background: '#f0f0f0',
            color: '#333',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#e0e0e0'}
          onMouseOut={(e) => e.currentTarget.style.background = '#f0f0f0'}
        >
          Join Room
        </button>
      </div>
    </div>
  );
}
