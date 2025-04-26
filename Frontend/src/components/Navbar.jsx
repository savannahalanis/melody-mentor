import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import notes from '../assets/notes.png';

function Navbar() {
  return (
    <nav>
      <div style={{
      backgroundColor: '#201f29',
      position: 'relative',
      height: '100px', // Adjusted height to fit the navbar content
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: '0 0 0 25px', // top right bottom left
    }}>

      <div> 
        {/* 5 Horizontal Lines as background */}
        <div style={{
          position: 'absolute',
          pointerEvents: 'none',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px 0 20px 0', // top right bottom left
          zIndex: 0,
        }}>
          {[...Array(5)].map((_, index) => (
            <div key={index} style={{
              width: '100%',
              height: '2px',
              backgroundColor: '#ADB2F7',
            }}></div>
          ))}
        </div>
      
        {/* Images over the lines */}
        <div style={{
          display: 'flex',
          gap: '40px', // Space between images
          zIndex: 1,
          justifyContent: 'flex-start',
          width: '100%', // Ensure it spans the entire width
        }}>
          <img src={logo} alt="logo" style={{ height: '70px' }} />
          <img src={notes} alt="notes" style={{ height: '70px' }} />
          <img src={notes} alt="notes" style={{ height: '70px' }} />
          <img src={notes} alt="notes" style={{ height: '70px' }} />
        </div>
      </div>
      </div>

        {/* Navbar Links */}
        <ul style={{
          backgroundColor: '#201f29',
          alignItems: 'center',
          display: 'flex',
          listStyle: 'none',
          justifyContent: 'center',
          padding: '5px 0 20px 0',
        }}>
          <li style={{ marginRight: '20px' }}>
            <Link to="/" style={linkStyle}>Home</Link>
          </li>
          <li style={{ marginRight: '20px' }}>
            <Link to="/about" style={linkStyle}>About</Link>
          </li>
          <li>
            <Link to="/play" style={linkStyle}>Play</Link>
          </li>
        </ul>
    </nav>
  );
}

// Define link styles
const linkStyle = {
  color: '#ADB2F7',
  textDecoration: 'none',
  fontSize: '18px',
  fontWeight: 'bold',
};

export default Navbar;
