import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import './Profile.css';

function Home() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [userID, setUserID] = useState('');
  const navigate = useNavigate(); 

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

  // Logout function
  const logout = () => {
    // Clear token from local storage
    localStorage.clear();
    
    const goToPageAndReload = (path) => {
      navigate(path, { replace: true, state: { reload: true } });
      window.location.reload();
    };

    goToPageAndReload('/login');

  };

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
        <p><b>Email</b> {email}</p><br></br>
        <button className="button" onClick={logout}>Logout</button>
      </div>
    </div>
  );
}

export default Home;
