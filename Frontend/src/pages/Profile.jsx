import './Home.css'

function Home() {
  return (
    <div style={{
      padding: '25px 25px 25px 25px', // top right bottom left
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '20px',
    }}>
      <div className = "box"> 
        <h1>Your Profile</h1>
        <p><b>Username</b> Savannah with THREE a's</p>
        <p><b>Email</b> savannah2004@ucla.edu</p>
      </div>

    </div>
  );
}

export default Home;
