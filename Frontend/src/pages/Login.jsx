import { useState } from 'react';
import './Login.css'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');

    const navigate = useNavigate();

    const goToPageAndReload = (path) => {
        navigate(path, { replace: true, state: { reload: true } });
        window.location.reload();
      };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        if (!checkEmail(loginEmail)) {
            alert('Please enter a valid email');
            return;
        }
    
        try {
            const response = await axios.post('http://localhost:5001/auth/login', {
                email: loginEmail,
                password: loginPassword
            });
    
            // Check if the response contains the expected data
            if (response && response.data) {
                // Store the JWT token and userId in localStorage
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userId', response.data.userid);
                localStorage.setItem('username', response.data.username);  // Assuming your backend returns username
                localStorage.setItem('email', response.data.email);
    
                console.log("USERID from login response: ", response.data.userid); // log to check
    
                goToPageAndReload('/play');
            } else {
                console.error('No data received from login response');
                alert('Login failed: No data received');
            }
        } catch (error) {
            // Check if the error object has a response property
            if (error.response) {
                console.error('Login error:', error.response.data.error);
                alert('Login failed: ' + error.response.data.error);
            } else {
                console.error('Error during login:', error.message);
                alert('Login failed: ' + error.message);
            }
        }
    };    

    function checkUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        return usernameRegex.test(username)
    }

    function checkPassword(password) {
        const usernamePassword = /^.{7,}$/;
        return usernamePassword.test(password)
    }


    function checkEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        const registerFormData = new FormData();
        registerFormData.append('email', registerEmail);
        registerFormData.append('password', registerPassword);
        registerFormData.append('username', registerUsername);

        if (!checkEmail(registerEmail)) {
            alert('Please enter a valid email');
        } else if (!checkUsername(registerUsername)) {
            alert('Username can only consist of letters, numbers, and underscore');
        } else if (!checkPassword(registerPassword)) {
            alert('Password must be at least 7 characters long');
        } else {

            try {
                const response = await fetch('http://localhost:5001/auth/register', {
                    method: 'POST',
                    body: registerFormData,
                    credentials: 'include',
                    mode: 'cors', // explicitly set cors mode
                });

                if (response.ok) {
                    alert('Registration successful!');
                } else {
                    const errorData = await response.json();
                    alert('Registration failed: ' + (errorData.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('Registration failed: ' + error.message);
            }
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
        }}>
            <div className='box'>
                <h1>Log in to Melody Mentor</h1>
                <form onSubmit={handleLoginSubmit}>
                    <br/><label htmlFor="loginEmail" className="prompt">Email Address </label>
                    <input 
                        type="text" 
                        id="loginEmail" 
                        name="loginEmail" 
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                    /><br/>
                    <label htmlFor="loginPassword" className="prompt">Password </label>
                    <input 
                        type="text" 
                        id="loginPassword" 
                        name="loginPassword" 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                    /><br/><br/>
                    <button type="submit" className="button">Login</button>
                </form>
            </div>
            
            <div className='box'>
                <h1>New to Melody Mentor? Register today!</h1>
                <form onSubmit={handleRegisterSubmit}>
                    <br/><label htmlFor="registerEmail" className="prompt">Email Address </label>
                    <input 
                        type="text" 
                        id="registerEmail" 
                        name="registerEmail" 
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                    /><br/>
                    <label htmlFor="registerUsername" className="prompt">Username </label>
                    <input 
                        type="text" 
                        id="registerUsername" 
                        name="registerUsername" 
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                    /><br/>
                    <label htmlFor="registerPassword" className="prompt">Password </label>
                    <input 
                        type="text" 
                        id="registerPassword" 
                        name="registerPassword" 
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                    /><br/><br/>
                    <button type="submit" className="button">Register</button>
                </form>
            </div>
        </div>
    );
}

export default Login;
