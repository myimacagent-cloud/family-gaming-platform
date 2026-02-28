import { Routes, Route, Navigate } from 'react-router-dom';
import Lobby from './pages/Lobby';
import Room from './pages/Room';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/room/:roomCode" element={<Room />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
