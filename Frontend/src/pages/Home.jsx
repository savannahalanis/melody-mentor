import Navbar from '../components/Navbar'; // Correct if Navbar.jsx is in components folder!

function Home() {
  return (
    <div style={{
      padding: '25px 25px 25px 25px', // top right bottom left
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '20px',
    }}>
      <div style = {{
        padding: '20px',
        backgroundColor: '#201f29',
        borderRadius: '25px',
      }}>
        <h1>What is NAME?</h1>
          <p>Name is your personal AI music teacher! Upload vidoes and NAME will give you personalized advice on how to improve. WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS </p>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: '20px',
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#201f29',
          borderRadius: '25px',
        }}> 
          <h1>Our Mission</h1>
          <p>Here at NAME we want to make music education more accessible. WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS </p>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: '#201f29',
          borderRadius: '25px',
        }}> 
          <h1>About is</h1>
          <p>Here at NAME we want to make music education more accessible. WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS WORDS </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
