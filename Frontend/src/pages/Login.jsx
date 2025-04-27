import { useState } from 'react';
import './Login.css'
import axios from 'axios';

function Login() {
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');

    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:5001/auth/login', {
                email: loginEmail,
                password: loginPassword
            });            

            // Store the JWT token in localStorage or sessionStorage
            localStorage.setItem('token', response.data.token);

            alert('Login successful!');
        } catch (error) {
            console.error('Login error:', error.response.data.error);
            alert('Login failed: ' + error.response.data.error);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        const registerFormData = new FormData();
        registerFormData.append('email', registerEmail);
        registerFormData.append('password', registerPassword);
        registerFormData.append('username', registerUsername);

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
