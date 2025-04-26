import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';  // Import Navbar
import Home from './pages/Home';
import About from './pages/About';
import Play from './pages/Play';

function App() {
  return (
    <Router>
      <Navbar />  {/* This will render the navbar on every page */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/play" element={<Play />} />
      </Routes>
    </Router>
  );
}

export default App;
