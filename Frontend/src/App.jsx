import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';  // Correct import
import Home from './pages/Home.jsx';
import Play from './pages/Play.jsx';
import Login from './pages/Login.jsx';

function App() {
  return (
    <Router>
      <Navbar />  {/* This will render the navbar on every page */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<Play />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
