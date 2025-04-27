import './Home.css'

function Home() {
  return (
    <div style={{
      padding: '25px 25px 25px 25px', // top right bottom left
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '0',
    }}>
      <div className = "box"> 
        <h1>What is Melody Mentor?</h1>
          <p>Melody Mentor is your personal AI music teacher. Upload vidoes of you playin an instrument and get personalized feedback. We'll help you with any instrument, from guitar, flute, piano, xylophone, and more!</p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: '0',
      }}>

        <div className = "box"> 
          <h1>Our Mission</h1>
          <p>Here at Melody Mentor, we're on a mission to make music education more accessible. Music education is important, yet it is often underfunded or neglected in schools. </p>
        </div>

        <div className = "box"> 
          <h1>About Us</h1>
          <p>Melody Mentor was created by Ava, Savannah, Cathleen, and Sakshi at LA Hacks.</p>
        </div>


      </div>
    </div>
  );
}

export default Home;
