import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Home() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [userID, setUserID] = useState('');

  useEffect(() => {
    // Fetch user profile
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:5001/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {
        setUsername(response.data.username);
        setEmail(response.data.email);
        setUserID(response.data.userID);
      })
      .catch(error => {
        console.error('Error fetching user profile:', error);
      });
    }
  }, []);

  return (
    <div style={{
      padding: '25px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '20px',
    }}>
      <div className="box">
        <h1>Your Profile</h1>
        <p><b>Username</b> {username}</p>
        <p><b>Email</b> {email}</p>
        <p><b>UserID</b> {userID}</p>
      </div>
    </div>
  );
}

export default Home;
