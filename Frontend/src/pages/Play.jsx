import { useRef, useState, useEffect } from 'react';

function Play() {
  const videoRef = useRef(null);
  const [videoURL, setVideoURL] = useState(null);
  const [musicURL, setMusicURL] = useState(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const [chatMessages, setChatMessages] = useState([
    { text: "Hello, I'm Melody Mentor, your guide today. What instrument do you play?", sender: "ai", id: 1, animate: true }
  ]);
  const [canAnalyze, setCanAnalyze] = useState(false);
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
      setCanAnalyze(true); // Enable analysis when video is uploaded
    }
  };

  const handleMusicUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMusicURL(url);
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
        setCanAnalyze(true); // Enable analysis after recording
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
        text: "Great! How can I help you today then? I can offer technique advice, recommend practice exercises, or analyze your playing.",
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

  // Add this after handleSkip function and before the return statement
  const submitToAI = async () => {
    if (!videoURL) {
      alert("Please upload or record a video first");
      return;
    }

    try {
      // Show loading message
      setChatMessages(prev => [...prev, { 
        text: "Analyzing your performance...", 
        sender: 'ai',
        id: Date.now(),
        animate: true
      }]);

      // Create FormData to send files
      const formData = new FormData();
      
      // Convert Blob URL back to File object if it's a recorded video
      if (recordedChunks.current.length > 0) {
        const videoBlob = new Blob(recordedChunks.current, { type: 'video/mp4' });
        formData.append('video', videoBlob, 'recorded-video.mp4');
      } else {
        // For uploaded video, we need to fetch the file from input
        const videoInput = document.getElementById('video-upload');
        if (videoInput.files[0]) {
          formData.append('video', videoInput.files[0]);
        } else {
          alert("Cannot process video. Please try uploading again.");
          return;
        }
      }
      
      // Add info about whether music is included
      const hasMusicFile = document.getElementById('music-upload').files[0];
      formData.append('music', hasMusicFile ? 'yes' : 'no');
      
      // Add music file if available
      if (hasMusicFile) {
        formData.append('musicFile', hasMusicFile);
      }

      // First start the session with the files
      // In your submitToAI function:
      const sessionResponse = await fetch('http://localhost:5000/startSession', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        mode: 'cors' // explicitly set cors mode
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Failed to start session');
      }
      
      // Then send the question to get advice
      const question = "Please analyze my playing technique and provide feedback";
      const adviceFormData = new FormData();
      adviceFormData.append('question', question);
      
      const adviceResponse = await fetch('http://localhost:5000/getAdvice', {
        method: 'POST',
        body: adviceFormData,
        credentials: 'include',
        mode: 'cors' // explicitly set cors mode
      });

      if (!adviceResponse.ok) {
        const errorData = await adviceResponse.json();
        throw new Error(errorData.error || 'Failed to get advice');
      }

      const responseData = await adviceResponse.json();
      
      // Add AI response
      setChatMessages(prev => prev.filter(msg => 
        msg.text !== "Analyzing your performance...").concat([{ 
        text: responseData.advice, 
        sender: 'ai',
        id: Date.now(),
        animate: true
      }]));
    } catch (error) {
      console.error("Error:", error);
      setChatMessages(prev => prev.filter(msg => 
        msg.text !== "Analyzing your performance...").concat([{ 
        text: `Error: ${error.message || "Something went wrong when analyzing your performance."}`, 
        sender: 'ai',
        id: Date.now(),
        animate: true
      }]));
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      overflow: 'hidden',
      backgroundColor: '#1a1a2e',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Video Section - Light Purple Box */}
      <div style={{ 
        width: `${leftPanelWidth}%`, 
        height: 'calc(100vh - 40px)',
        backgroundColor: '#e6e6fa',
        borderRadius: '24px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px',
          overflow: 'auto',
          flex: 1
        }}>
          <h1 style={{ 
            color: '#4B0082', 
            marginBottom: '20px',
            fontSize: '28px'
          }}>Music Analyzer</h1>

          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '20px' 
          }}>
            {/* Video Upload Button */}
            <label 
              htmlFor="video-upload" 
              style={{
                display: 'inline-block',
                padding: '15px 30px',
                backgroundColor: '#A789E2',
                color: 'white',
                borderRadius: '30px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                margin: '5px',
              }}
            >
              Upload Video
            </label>
            <input 
              id="video-upload" 
              type="file" 
              accept="video/mp4" 
              onChange={handleUpload} 
              style={{ display: 'none' }}
            />

            {/* Music Upload Button */}
            <label 
              htmlFor="music-upload" 
              style={{
                display: 'inline-block',
                padding: '15px 30px',
                backgroundColor: '#939DF3',
                color: 'white',
                borderRadius: '30px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                margin: '5px',
              }}
            >
              Upload Sheet Music
            </label>
            <input 
              id="music-upload" 
              type="file" 
              accept="application/pdf" 
              onChange={handleMusicUpload} 
              style={{ display: 'none' }}
            />
            
            {/* Record Button */}
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
                  margin: '5px',
                }}
              >
                Stop Recording
              </button>
            ) : (
              <button 
                onClick={startRecording}
                style={{
                  padding: '15px 30px',
                  backgroundColor: '#76A2EF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  margin: '5px',
                }}
              >
                Record Video (Webcam)
              </button>
            )}
          </div>

          {/* Video Display Area */}
          <div
            style={{
              width: '100%',
              height: 'auto',
              aspectRatio: '16 / 9',
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
              position: 'relative',
              marginBottom: '20px',
              transition: 'all 0.3s ease',
              border: '3px solid #d8c3ff',
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
                  borderRadius: '20px'
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
                  borderRadius: '20px'
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
                background: 'linear-gradient(145deg, #2d2d3a, #1d1d2a)',
                color: 'white',
                borderRadius: '20px'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '15px',
                  boxShadow: '0 0 20px rgba(52, 152, 219, 0.3)',
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 7C18 5.9 17.1 5 16 5H4C2.9 5 2 5.9 2 7V17C2 18.1 2.9 19 4 19H16C17.1 19 18 18.1 18 17V13.5L22 17.5V6.5L18 10.5V7Z" fill="rgba(255,255,255,0.9)"/>
                  </svg>
                </div>
                <p style={{ 
                  marginTop: '5px', 
                  fontSize: '16px', 
                  fontWeight: '500',
                  opacity: '0.9',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}>
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
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderRadius: '24px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(4px)',
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#f44336',
                  borderRadius: '50%',
                  animation: 'pulsate 1.5s infinite',
                  boxShadow: '0 0 8px rgba(244, 67, 54, 0.6)',
                }}></div>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>Recording</span>
              </div>
            )}
          </div>

          {/* Music player section - only show when music is uploaded */}
          {musicURL && (
            <div style={{
              width: '100%',
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: 'rgba(147, 112, 219, 0.1)',
              borderRadius: '15px',
              border: '1px solid #d8c3ff',
            }}>
              <p style={{ 
                marginBottom: '10px',
                color: '#4B0082',
                fontWeight: '500'
              }}>
                Uploaded Music
              </p>
              <audio 
                controls 
                src={musicURL}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Resizable Separator */}
      <div 
        ref={separatorRef}
        style={{
          width: '20px',
          cursor: 'col-resize',
          backgroundColor: 'transparent',
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
          width: '6px',
          backgroundColor: isDragging ? '#d8c3ff' : '#9370DB',
          borderRadius: '3px',
          opacity: isDragging ? 1 : 0.6,
          transition: 'opacity 0.3s, background-color 0.3s'
        }}></div>
      </div>

      {/* Chat Section */}
      <div
        style={{
          width: `${100 - leftPanelWidth - 2}%`, // Adjusted for separator width
          height: 'calc(100vh - 40px)',
          backgroundColor: '#e6e6fa',
          borderRadius: '24px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Title Section */}
          <div style={{
            marginBottom: '20px',
            textAlign: 'center',
            padding: '10px 0',
            borderBottom: '2px solid #9370DB'
          }}>
            <h2 style={{
              color: '#4B0082',
              margin: '0',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>Melody Mentor</h2>
            <p style={{
              color: '#666',
              margin: '5px 0 0 0',
              fontSize: '14px'
            }}>your personal instrument guider</p>
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
                    backgroundColor: msg.sender === 'user' ? '#7382E8' : '#9892F3',
                    color: 'white',
                    borderRadius: msg.sender === 'user' ? '18px 18px 0 18px' : '18px 18px 18px 0',
                    maxWidth: '80%',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    wordBreak: 'break-word'
                  }}
                >
                  {msg.text}
                </div>

                {/* Action buttons area */}
                <div 
                  style={{
                    marginTop: '8px',
                    display: 'flex',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'fadeIn 0.5s forwards',
                    animationDelay: '0.5s',
                    opacity: msg.animate ? 0 : 1,
                    gap: '8px'
                  }}
                >
                  {/* Show skip button when appropriate */}
                  {msg.sender === 'ai' && 
                  index === chatMessages.length - 1 && 
                  showSkipButton && 
                  currentStep <= 2 && (
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
                )}

                {/* Show analyze button when video is available and this is the latest message */}
                {msg.sender === 'ai' && 
                index === chatMessages.length - 1 && 
                videoURL && 
                canAnalyze && (
                  <button
                    onClick={submitToAI}
                    style={{
                      backgroundColor: '#6C4AB6',
                      border: 'none',
                      borderRadius: '15px',
                      padding: '8px 15px',
                      fontSize: '14px',
                      color: 'white',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#5a3a99';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#6C4AB6';
                    }}
                  >
                    Analyze My Playing
                  </button>
                )}
              </div>
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
                border: '1px solid #d8c3ff',
                fontSize: '16px',
                backgroundColor: 'white',
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
                backgroundColor: '#9370DB',
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

        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
      `}</style>
    </div>
  );
}

export default Play;