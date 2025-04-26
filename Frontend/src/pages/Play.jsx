import { useRef, useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

function Play() {
  const videoRef = useRef(null);
  const [videoURL, setVideoURL] = useState(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const [chatMessages, setChatMessages] = useState([
    { text: "Hello, I'm Music Mentor, your guide today. What instrument do you play?", sender: "ai", id: 1, animate: true }
  ]);
  const [userInput, setUserInput] = useState('');
  const [showSkipButton, setShowSkipButton] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const chatContainerRef = useRef(null);
  
  // State for resizable panels
  const [leftPanelWidth, setLeftPanelWidth] = useState(70);
  const [isDragging, setIsDragging] = useState(false);
  const separatorRef = useRef(null);

  // Scroll to bottom when new message appears
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle resizing logic
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const containerWidth = window.innerWidth;
      const newLeftWidth = (e.clientX / containerWidth) * 100;
      
      // Limit the minimum and maximum sizes
      if (newLeftWidth >= 30 && newLeftWidth <= 85) {
        setLeftPanelWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoURL(url);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef.current.srcObject = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);

      recordedChunks.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunks.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/mp4' });
        setVideoURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("Could not access camera or microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSendMessage = async () => {
    if (userInput.trim() !== '') {
      // Add user message
      setChatMessages(prev => [...prev, { 
        text: userInput, 
        sender: 'user',
        id: Date.now(),
        animate: true
      }]);
      
      // Clear input
      setUserInput('');
      
      // Hide skip button
      setShowSkipButton(false);
      
      // Determine which AI response to show based on current step
      if (currentStep === 1) {
        // After they respond to "What instrument do you play?"
        setTimeout(() => {
          setChatMessages(prev => [...prev, { 
            text: "Great choice! How can I help you with your instrument today? I can offer technique advice, recommend practice exercises, or analyze your playing.",
            sender: 'ai',
            id: Date.now(),
            animate: true
          }]);
          setCurrentStep(2);
          setShowSkipButton(true);
        }, 1000);
      } else {
        // Default response for later interactions
        try {
          const response = await fetch('/api/get-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput: userInput })
          });
          
          const feedback = await response.json();

          // Add AI response with delay for natural feel
          setTimeout(() => {
            setChatMessages(prev => [...prev, { 
              text: feedback.message || "I understand. Let me help you with that.",
              sender: 'ai',
              id: Date.now(),
              animate: true
            }]);
          }, 1000);
        } catch (error) {
          console.error("Error communicating with API:", error);
          // Fallback response
          setTimeout(() => {
            setChatMessages(prev => [...prev, { 
              text: "I'm sorry, I couldn't process your request at the moment.",
              sender: 'ai',
              id: Date.now(),
              animate: true
            }]);
          }, 1000);
        }
      }
    }
  };

  const handleSkip = () => {
    if (currentStep === 1) {
      // Skip the first question about instrument
      setChatMessages(prev => [...prev, { 
        text: "Great! How can I help you with your instrument today? I can offer technique advice, recommend practice exercises, or analyze your playing.",
        sender: 'ai',
        id: Date.now(),
        animate: true
      }]);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Skip the second question about how to help
      setChatMessages(prev => [...prev, { 
        text: "I'm ready to help whenever you need it. You can upload a video or record yourself playing, and I'll provide feedback on your technique.",
        sender: 'ai',
        id: Date.now(),
        animate: true
      }]);
      setCurrentStep(3);
      setShowSkipButton(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Video Section */}
      <div style={{ 
        width: `${leftPanelWidth}%`, 
        padding: '20px',
        overflow: 'auto'
      }}>
        <h1>Video Recorder</h1>

        <div style={{ marginTop: '20px', marginBottom: '10px' }}>
          <label 
            htmlFor="file-upload" 
            style={{
              display: 'inline-block',
              padding: '15px 30px',
              backgroundColor: '#3373D4',
              color: 'white',
              borderRadius: '30px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            Upload Video
          </label>
          <input 
            id="file-upload" 
            type="file" 
            accept="video/mp4" 
            onChange={handleUpload} 
            style={{ display: 'none' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          {recording ? (
            <button 
              onClick={stopRecording}
              style={{
                padding: '15px 30px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              Stop Recording
            </button>
          ) : (
            <button 
              onClick={startRecording}
              style={{
                padding: '15px 30px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              Record Video
            </button>
          )}
        </div>

        <div
          style={{
            width: '100%',
            height: 'auto',
            aspectRatio: '16 / 9',
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
            position: 'relative',
            marginBottom: '20px',
            transition: 'all 0.3s ease',
          }}
        >
          {videoURL ? (
            <video
              ref={videoRef}
              src={videoURL}
              controls
              autoPlay
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                borderRadius: '10px'
              }}
            />
          ) : recording ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              style={{ 
                width: '100%', 
                height: '100%',
                objectFit: 'cover',
                borderRadius: '10px'
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#222',
              color: 'white',
              borderRadius: '10px'
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 7C18 5.9 17.1 5 16 5H4C2.9 5 2 5.9 2 7V17C2 18.1 2.9 19 4 19H16C17.1 19 18 18.1 18 17V13.5L22 17.5V6.5L18 10.5V7Z" fill="rgba(255,255,255,0.8)"/>
              </svg>
              <p style={{ marginTop: '10px', fontSize: '16px', opacity: '0.8' }}>
                Ready to record or upload
              </p>
            </div>
          )}
          
          {/* Recording indicator */}
          {recording && (
            <div style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: '20px',
              padding: '5px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#f44336',
                borderRadius: '50%',
                animation: 'pulsate 1.5s infinite',
              }}></div>
              <span style={{ color: 'white', fontSize: '14px' }}>Recording</span>
            </div>
          )}
        </div>
      </div>

      {/* Resizable Separator */}
      <div 
        ref={separatorRef}
        style={{
          width: '10px',
          cursor: 'col-resize',
          backgroundColor: isDragging ? '#2642B3' : '#ccc',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.3s',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Drag handle indicator */}
        <div style={{
          height: '50px',
          width: '4px',
          backgroundColor: isDragging ? 'white' : '#666',
          borderRadius: '2px',
        }}></div>
      </div>

      {/* Chat Section */}
      <div
        style={{
          width: `${100 - leftPanelWidth - 1}%`, // Subtract separator width
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        {/* Title Section */}
        <div style={{
          marginBottom: '20px',
          textAlign: 'center',
          padding: '10px 0',
          borderBottom: '2px solid #3373D4'
        }}>
          <h2 style={{
            color: '#2642B3',
            margin: '0',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>Music Mentor</h2>
          <p style={{
            color: '#666',
            margin: '5px 0 0 0',
            fontSize: '14px'
          }}>Your personal instrument tutor</p>
        </div>

        {/* Chat Messages */}
        <div
          id="chat-container"
          ref={chatContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '15px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            marginBottom: '15px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {chatMessages.map((msg, index) => (
            <div
              key={msg.id}
              style={{
                textAlign: msg.sender === 'user' ? 'right' : 'left',
                marginBottom: '10px',
                opacity: msg.animate ? 0 : 1,
                transform: msg.animate ? 'translateY(20px)' : 'translateY(0)',
                animation: msg.animate ? 'fadeInUp 0.5s forwards' : 'none',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '12px 16px',
                  backgroundColor: msg.sender === 'user' ? '#2642B3' : '#AC00BF',
                  color: 'white',
                  borderRadius: msg.sender === 'user' ? '18px 18px 0 18px' : '18px 18px 18px 0',
                  maxWidth: '80%',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  wordBreak: 'break-word'
                }}
              >
                {msg.text}
              </div>
              
              {/* Show skip button only after AI messages when appropriate */}
              {msg.sender === 'ai' && 
               index === chatMessages.length - 1 && 
               showSkipButton && 
               currentStep <= 2 && (
                <div 
                  style={{
                    marginTop: '8px',
                    display: 'flex',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'fadeIn 0.5s forwards',
                    animationDelay: '0.5s',
                    opacity: 0
                  }}
                >
                  <button
                    onClick={handleSkip}
                    style={{
                      backgroundColor: '#f0f0f0',
                      border: 'none',
                      borderRadius: '15px',
                      padding: '8px 15px',
                      fontSize: '14px',
                      color: '#555',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#e0e0e0';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                    }}
                  >
                    Skip
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          marginTop: '10px'
        }}>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask something to the AI..."
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '30px',
              border: '1px solid #ccc',
              fontSize: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1) inset',
              outline: 'none'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={handleSendMessage}
            style={{
              marginLeft: '10px',
              padding: '14px 20px',
              borderRadius: '30px',
              border: 'none',
              backgroundColor: '#2642B3',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease',
            }}
          >
            Send
          </button>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes pulsate {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default Play;