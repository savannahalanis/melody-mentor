import { useRef, useState } from 'react';

function Play() {
  const videoRef = useRef(null);
  const [videoURL, setVideoURL] = useState(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const [chatMessages, setChatMessages] = useState([]); // Holds the chat history
  const [userInput, setUserInput] = useState(''); // Holds user input in the chat

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoURL(url);
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  // Function to send the user input to the backend
  const handleSendMessage = async () => {
    if (userInput.trim() !== '') {
      // Add user message to the chat
      setChatMessages([...chatMessages, { text: userInput, sender: 'user' }]);

      // Call backend API to get AI feedback (This is a placeholder, replace with your API logic)
      const response = await fetch('/api/get-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: userInput })
      });
      const feedback = await response.json();

      // Add AI feedback to the chat
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { text: feedback.message, sender: 'ai' },
      ]);

      setUserInput(''); // Clear user input after sending
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '70%', padding: '20px' }}>
        <h1>Play Page</h1>
        <p>Here is where most of the functionality will go.</p>

        <div style={{ marginBottom: '10px' }}>
          <input type="file" accept="video/mp4" onChange={handleUpload} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          {recording ? (
            <button onClick={stopRecording}>Stop Recording</button>
          ) : (
            <button onClick={startRecording}>Record Video</button>
          )}
        </div>

        <div
          style={{
            width: '640px',
            height: '360px',
            border: '2px solid black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {videoURL ? (
            <video
              ref={videoRef}
              src={videoURL}
              controls
              autoPlay
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </div>
      </div>

      {/* Chat Section */}
      <div
        style={{
          width: '30%',
          padding: '20px',
          borderLeft: '2px solid #ccc',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            height: '70%',
            overflowY: 'auto',
            borderBottom: '2px solid #ccc',
            paddingBottom: '10px',
            marginBottom: '10px',
            backgroundColor: 'white',
          }}
        >
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              style={{
                textAlign: msg.sender === 'user' ? 'right' : 'left',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '10px',
                  backgroundColor: msg.sender === 'user' ? '#2642B3' : '#F8D7DA',
                  borderRadius: '10px',
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask something to the AI..."
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
            }}
          />
          <button
            onClick={handleSendMessage}
            style={{
              marginLeft: '10px',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Play;
