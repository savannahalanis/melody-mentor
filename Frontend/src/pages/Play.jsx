import { useRef, useState, useEffect } from 'react';

function Play() {
  const videoRef = useRef(null);
  const [videoURL, setVideoURL] = useState(null);
  const [musicURL, setMusicURL] = useState(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const [chatMessages, setChatMessages] = useState([
    { text: "Hello, I'm Melody, your music guide today. Please upload a video of your playing or record yourself directly. You can also upload sheet music for more detailed analysis.", sender: "ai", id: 1, animate: true }
  ]);
  const [userInput, setUserInput] = useState('');
  // const [currentStep, setCurrentStep] = useState(1);
  const chatContainerRef = useRef(null);

  // Update your state variables to track the session state
  const [sessionStarted, setSessionStarted] = useState(false);
  const [canAnalyze, setCanAnalyze] = useState(false);
  const [videoAnalyzed, setVideoAnalyzed] = useState(false);

  const [newVideo, setNewVideo] = useState(false);
  
  // Add this to your state variables
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  
  // const [userId, setUserId] = useState("680d6d9bb3cdbb04bc5d0c9e"); // Replace with actual user ID logic

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
    if (sessionStarted) {
      setNewVideo(true);
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
      setRecording(true);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      } else {
        console.error("Video element reference is null");
        throw new Error("Video element not initialized");
      }

      mediaRecorderRef.current = new MediaRecorder(stream);

      recordedChunks.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunks.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/mp4' });
        setVideoURL(URL.createObjectURL(blob));
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = newVideoURL; // Fixed: use the stored variable
        }
        setCanAnalyze(true); // Enable analysis after recording
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();

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
      const currentInput = userInput;
      setUserInput('');
      
      // If session hasn't started yet, remind user to start a session
      if (!sessionStarted) {
        setTimeout(() => {
          setChatMessages(prev => [...prev, { 
            text: "Please upload or record a video, and click 'Submit Recording' to start a session before we continue.",
            sender: 'ai',
            id: Date.now(),
            animate: true
          }]);
        }, 1000);
        return;
      }

      // Processing the user's message if session has started
      try {
        // Show typing indicator
        setChatMessages(prev => [...prev, { 
          text: "...", 
          sender: 'ai',
          id: Date.now() + '-typing',
          animate: true,
          isTyping: true
        }]);
        
        const adviceFormData = new FormData();
        adviceFormData.append('question', currentInput);
        adviceFormData.append('userid', userId);
        
        const adviceResponse = await fetch('http://localhost:5001/music/getAdvice', {
          method: 'POST',
          body: adviceFormData,
          credentials: 'include',
          mode: 'cors'
        });

        if (!adviceResponse.ok) {
          const errorText = await adviceResponse.text();
          let errorMessage = "Failed to get advice";
          
          try {
            // Try to parse the error as JSON
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If parsing fails, use the raw text if available
            if (errorText) errorMessage = errorText;
          }
          
          throw new Error(errorMessage);
        }
  
        const responseData = await adviceResponse.json();
        
        // Remove typing indicator and add real response
        setChatMessages(prev => prev.filter(msg => !msg.isTyping).concat([{ 
          text: responseData.advice, 
          sender: 'ai',
          id: Date.now(),
          animate: true
        }]));
      } catch (error) {
        console.error("Error:", error);
        // Remove typing indicator and add error message
        setChatMessages(prev => prev.filter(msg => !msg.isTyping).concat([{ 
          text: "I'm sorry, I couldn't process your request at the moment.",
          sender: 'ai',
          id: Date.now(),
          animate: true
        }]));
      }
    }
  };

  const startSession = async () => {
    if (!videoURL) {
      alert("Please upload or record a video first");
      return;
    }
    
    try {
      // Show loading message
      setChatMessages(prev => [...prev, { 
        text: "Starting your session...", 
        sender: 'ai',
        id: Date.now(),
        animate: true
      }]);

      // Create FormData to send files
      const formData = new FormData();
      formData.append('userid', userId);
      
      // Process video file
      if (recordedChunks.current.length > 0) {
        const videoBlob = new Blob(recordedChunks.current, { type: 'video/mp4' });
        const videoFile = new File([videoBlob], "recorded-video.mp4", { 
          type: 'video/mp4',
          lastModified: Date.now() 
        });
        formData.append('video', videoFile);
      } else {
        const videoInput = document.getElementById('video-upload');
        if (videoInput.files[0]) {
          formData.append('video', videoInput.files[0]);
        } else {
          alert("Cannot process video. Please try uploading again.");
          return;
        }
      }

      // Add music file if available
      const hasMusicFile = document.getElementById('music-upload').files[0];
      formData.append('music', hasMusicFile ? 'yes' : 'no');
      
      if (hasMusicFile) {
        formData.append('musicFile', hasMusicFile);
      }
      
      // Start the session
      const sessionResponse = await fetch('http://localhost:5001/music/startSession', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        mode: 'cors'
      });
      
      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Failed to start session');
      }
      
      // Session started successfully
      setSessionStarted(true);

      // Remove loading message
      setChatMessages(prev => prev.filter(msg => 
        msg.text !== "Starting your session...").concat([{ 
        text: "Session started! How would you like me to help you today? I can analyze your playing technique and suggest improvements!", 
        sender: 'ai',
        id: Date.now(),
        animate: true
      }]));
      
      // Enable analysis option
      setCanAnalyze(true);
      
    } catch (error) {
      console.error("Error starting session:", error);
      setChatMessages(prev => prev.filter(msg => 
        msg.text !== "Starting your session...").concat([{ 
        text: `Error: ${error.message || "Something went wrong when starting your session."}`, 
        sender: 'ai',
        id: Date.now(),
        animate: true
      }]));
    }
  };

  const newRecording = async () => {
    if (!videoURL) {
      alert("Please upload or record a video first");
      return;
    }
    
    try {
      // Show loading message
      setChatMessages(prev => [...prev, { 
        text: "Submitting new recording...", 
        sender: 'ai',
        id: Date.now(),
        animate: true
      }]);

      // Create FormData to send files
      const formData = new FormData();
      formData.append('userid', userId);
      
      // Process video file
      if (recordedChunks.current.length > 0) {
        const videoBlob = new Blob(recordedChunks.current, { type: 'video/mp4' });
        const videoFile = new File([videoBlob], "recorded-video.mp4", { 
          type: 'video/mp4',
          lastModified: Date.now() 
        });
        formData.append('video', videoFile);
      } else {
        const videoInput = document.getElementById('video-upload');
        if (videoInput.files[0]) {
          formData.append('video', videoInput.files[0]);
        } else {
          alert("Cannot process video. Please try uploading again.");
          return;
        }
      }

      // Add music file if available
      const hasMusicFile = document.getElementById('music-upload').files[0];
      formData.append('music', hasMusicFile ? 'yes' : 'no');
      
      if (hasMusicFile) {
        formData.append('musicFile', hasMusicFile);
      }
      
      // Start the session
      const sessionResponse = await fetch('http://localhost:5001/music/startSession', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        mode: 'cors'
      });
      
      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Failed to start session');
      }
      
      // Session started successfully
      setSessionStarted(true);

      // Remove loading message
      setChatMessages(prev => prev.filter(msg => 
        msg.text !== "Submitting new recording...").concat([{ 
        text: "New recording submitted!", 
        sender: 'ai',
        id: Date.now(),
        animate: true
      }]));
      
      // Enable analysis option
      setCanAnalyze(true);
      
    } catch (error) {
      console.error("Error starting session:", error);
      setChatMessages(prev => prev.filter(msg => 
        msg.text !== "Submitting new recording...").concat([{ 
        text: `Error: ${error.message || "Something went wrong when submitting your new recording. Please refresh."}`, 
        sender: 'ai',
        id: Date.now(),
        animate: true
      }]));
    }
  };
  

  const submitToAI = async () => {
    if (!videoURL) {
      alert("Please upload or record a video first");
      return;
    }

    //If user is not logged in, alert them
    if (!userId) {
      alert("Please log in to analyze your playing");
      return;
    }

    try {
      setVideoAnalyzed(true);

      setChatMessages(prev => [...prev, { 
        text: "Analyzing your performance...", 
        sender: 'ai',
        id: Date.now(),
        animate: true
      }]);
      
      // Then send the question to get advice
      const question = "Please analyze my playing technique and provide feedback on what I did wrong and how I can improve. Be specific.";
      const adviceFormData = new FormData();
      adviceFormData.append('question', question);
      adviceFormData.append('userid', userId);
      
      const adviceResponse = await fetch('http://localhost:5001/music/getAdvice', {
        method: 'POST',
        body: adviceFormData,
        credentials: 'include',
        mode: 'cors' // explicitly set cors mode
      });

      if (!adviceResponse.ok) {
        const errorText = await adviceResponse.text();
        let errorMessage = "Failed to get advice";
        
        try {
          // Try to parse the error as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If parsing fails, use the raw text if available
          if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
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

  // Add this function to end and save the session
  const endSession = async () => {
    if (!userId || chatMessages.length <= 1) {
      return; // Don't save if no user or meaningful conversation
    }

    try {
      // Create a formatted history of just the messages for saving
      const historyToSave = chatMessages.map(msg => ({
        text: msg.text,
        sender: msg.sender
      }));

      const formData = new FormData();
      formData.append('userid', userId);
      formData.append('history', JSON.stringify(historyToSave));

      // Send request to end session and save history
      await fetch('http://localhost:5001/music/endSession', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        mode: 'cors'
      });

      console.log("Session saved successfully");

      // Reset the state to start fresh
      setVideoURL(null);
      setMusicURL(null);
      setSessionStarted(false);
      setCanAnalyze(false);
      setVideoAnalyzed(false);
      
      // Reset chat to initial greeting
      setChatMessages([
        { 
          text: "Hello, I'm Melody, your music guide today. Please upload a video of your playing or record yourself directly. You can also upload sheet music for more detailed analysis.", 
          sender: "ai", 
          id: Date.now(), 
          animate: true 
        }
      ]);

      // Clear file inputs
      const videoInput = document.getElementById('video-upload');
      const musicInput = document.getElementById('music-upload');
      if (videoInput) videoInput.value = '';
      if (musicInput) musicInput.value = '';
      
      // Reset any recorded chunks
      recordedChunks.current = [];

    } catch (error) {
      console.error("Error saving session:", error);
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
                  color: 'white',
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
                    backgroundColor: msg.sender === 'user' ? '#7382E8' : '#AD98E6',
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
                    alignItems: 'center',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'fadeIn 0.5s forwards',
                    animationDelay: '0.5s',
                    opacity: msg.animate ? 0 : 1,
                    gap: '8px'
                  }}
                >
                  {/* Show submit recording button when video is available and session hasn't started */}
                  {msg.sender === 'ai' && 
                  index === chatMessages.length - 1 && 
                  videoURL && 
                  !sessionStarted && (
                    <button
                      onClick={startSession}
                      style={{
                        backgroundColor: '#C598E6',
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
                        e.currentTarget.style.backgroundColor = '#C598E6';
                      }}
                    >
                      Start Session
                    </button>
                  )}

                  {/* Show submit recording button when video is available and session hasn't started */}
                  {msg.sender === 'ai' && 
                  index === chatMessages.length - 1 && 
                  videoURL && 
                  newVideo && (
                    <button
                      onClick={newRecording}
                      style={{
                        backgroundColor: '#AE8BE4',
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
                        e.currentTarget.style.backgroundColor = '#AE8BE4';
                      }}
                    >
                      Submit New Recording
                    </button>
                  )}

                {/* Show analyze button when video is available and this is the latest message */}
                {msg.sender === 'ai' && 
                index === chatMessages.length - 1 && 
                videoURL && 
                canAnalyze &&
                !videoAnalyzed && (
                  <button
                    onClick={submitToAI}
                    style={{
                      backgroundColor: '#7165E2',
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
                      e.currentTarget.style.backgroundColor = '#A098E6';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#7165E2';
                    }}
                  >
                    Analyze My Playing
                  </button>
                )}
              </div>

              {/* End Session button - shows below analyze button and only on the last message */}
              {msg.sender === 'ai' &&
              index === chatMessages.length - 1 &&
              userId &&
              sessionStarted && (
                <button
                  onClick={endSession}
                  style={{
                    backgroundColor: '#3B61DE',
                    border: 'none',
                    borderRadius: '15px',
                    padding: '8px 15px',
                    fontSize: '14px',
                    marginTop: '5px',
                    color: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease',
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#94A9EE';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#3B61DE';
                  }}
                >
                  End Session
                  </button>
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
              placeholder="  Ask something to the AI..."
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '30px',
                border: '1px solid #d8c3ff',
                fontSize: '16px',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1) inset',
                outline: 'none',
                height: '50px'
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