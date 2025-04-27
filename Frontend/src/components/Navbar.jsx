import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Navbar.css';
import { useState, useEffect } from 'react';

function Navbar() {
  const [userID, setUserID] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUserID(true);
    }
  }, []);
  

  return (
    <nav>
      <div style={{
      backgroundColor: '#420878',
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
              height: '1px',
              backgroundColor: '#9d7db5',
            }}></div>
          ))}
        </div>

        <div className="top">
      
          {/* Images over the lines */}
            <p className="logo"><b>Melody</b></p>
            <p className="dots"><b>:</b></p>

            <p className="eigth">♪</p>
            <p className="beamed-eight"> ♫</p>
            <p className="beamed-sixteenth">♬</p>

            <p className="eigth">♪</p>
            <p className="beamed-eight"> ♫</p>
            <p className="beamed-sixteenth">♬</p>

            <p className="eigth">♪</p>
            <p className="beamed-eight"> ♫</p>
            <p className="beamed-sixteenth">♬</p>

            <p className="eigth">♪</p>
            <p className="beamed-eight"> ♫</p>
            <p className="beamed-sixteenth">♬</p>

            <p className="eigth">♪</p>
            <p className="beamed-eight"> ♫</p>
            <p className="beamed-sixteenth">♬</p>
        </div>
      </div>
      </div>

        {/* Navbar Links */}
        <ul style={{
          backgroundColor: '#420878',
          alignItems: 'center',
          display: 'flex',
          listStyle: 'none',
          justifyContent: 'center',
          padding: '5px 0 20px 0',
          color: '#deaae2',
        }}>
          <li style={{ marginRight: '20px' }}>
                <Link to="/" style={linkStyle}>Home</Link>
          </li>

          {userID ? (
              <>
                <li style={{ marginRight: '20px' }}>
                  <Link to="/play" style={linkStyle}> Play </Link>
                </li>
                <li style={{ marginRight: '20px' }}>
                  <Link to="/profile" style={linkStyle}> Profile </Link>
                </li>
              </>
             ) : (
              <li style={{ marginRight: '20px' }}>
                <Link to="/login" style={linkStyle}> Login </Link>
              </li>
          )}
        </ul>
    </nav>
  );
}

// Define link styles
const linkStyle = {
  color: '#debff6',
  textDecoration: 'none',
  fontSize: '18px',
  fontWeight: 'bold',
};

export default Navbar;
