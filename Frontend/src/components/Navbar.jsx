import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={{
      backgroundColor: '#201f29', 
      height: '150px',          // Height of the navbar
      display: 'flex',          // Use flexbox for content alignment
      flexDirection: 'column',  // Stack items vertically
      justifyContent: 'center', // Center items vertically
      alignItems: 'left',     // Center items horizontally
    }}>
      {/* Horizontal Lines */}
      <div style={{
        width: '100%', 
        height: '2px', 
        backgroundColor: '#ADB2F7', // Purple color for the lines
        margin: '7px 0',
      }}></div> {/* Line 1 */}
        <div style={{
        width: '100%', 
        height: '2px', 
        backgroundColor: '#ADB2F7', // Purple color for the lines
        margin: '7px 0',
      }}></div>{/* Line 2 */}
        <div style={{
        width: '100%', 
        height: '2px', 
        backgroundColor: '#ADB2F7', // Purple color for the lines
        margin: '7px 0',
      }}></div> {/* Line 3 */}
        <div style={{
        width: '100%', 
        height: '2px', 
        backgroundColor: '#ADB2F7', // Purple color for the lines
        margin: '7px 0',
      }}></div> {/* Line 4 */}
      <div style={{
        width: '100%', 
        height: '2px', 
        backgroundColor: '#ADB2F7', // Purple color for the lines
        margin: '7px 0',
      }}></div> {/* Line 5 */}


        {/* Navbar Links */}
            <ul style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0 }}>
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
  color: '#ADB2F7', // Set text color to black for better contrast
  textDecoration: 'none',
  fontSize: '18px',
  fontWeight: 'bold',
};

export default Navbar;
