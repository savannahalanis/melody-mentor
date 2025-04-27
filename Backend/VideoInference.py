import time
import os
import uuid
from dotenv import load_dotenv
from google import genai
from google.genai import types
from flask import Flask, request, session, jsonify
from flask_cors import CORS

load_dotenv()
api_key = os.environ.get('geminikey')

#set up the Flask route 
# app = Flask(__name__)
# CORS(app) #enables CORS for all routes and origins, needed for the cross platform cors is cross-origin
# app.secret_key= os.environ.get('sessionkey')

# Replace the simple CORS setup with:
# Replace the existing CORS setup with this:
app = Flask(__name__)
CORS(app, 
     supports_credentials=True, 
     origins=["http://localhost:5173", "http://localhost:5174"],
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "OPTIONS"])
app.secret_key = os.environ.get('sessionkey')


#if you make this a posat request everytime you submit your music then itll just get overriden each time which is good 
#using sessions will let you just chat with the bot which should make that part faster!
@app.route("/startSession", methods=['POST'])
def start_session():
    video=request.files['video']
    if video.filename.rsplit('.', 1)[1].lower() != 'mp4':
        return jsonify({"error": "Must upload a valid video (mp4)."}), 400

    session_id, video_path = save_video(video)

    if request.form['music'] == 'yes':
        music=request.files['musicFile']
        if music.filename.rsplit('.', 1)[1].lower() != 'pdf':
            return jsonify({"error": "Must upload music as PDF."}), 400

        music_path = save_music(music, session_id)
        session['music_path'] = music_path
        session['music'] = 'yes'
    else:
        #hold session information about music so that we can know if this is needed or now
        session['music'] = 'no'

    # Store the session information in the Flask session
    session['session_id'] = session_id
    session['video_path'] = video_path
    return jsonify({"message": f"Session started! Video saved as {video_path}"}), 200


@app.route("/getAdvice", methods = ['POST'])
def giveAnalysis():
    if 'session_id' not in session:
        return jsonify({"error": "You must upload a video first."}), 400

    session_id = session.get('session_id')
    video_path = session.get('video_path')
    music_path=""
    if session.get('music') == 'yes':
        music_path=session.get('music_path')

    question=request.form['question']
    if not question:
        return jsonify({"error": "You must provide a question."}), 400

    prompt = makeQuestions(music_path, question)
    response = analyzeVideo(video_path, music_path, prompt)
    return jsonify({"advice": response}), 200


#saves the video and creates a session for the chatbot!
def save_video(video):
    session_id=str(uuid.uuid4())
    video_path = f'SavedVideos/{session_id}.mp4'
    video.save(video_path)
    return session_id, video_path

def save_music(music, session_id):
    music_path = f'SavedMusic{session_id}.pdf'
    music.save(music_path)
    return music_path

#this combined everything that is not the video for the model to take in 
def makeQuestions(music, questions):

    musicQuestion = ""
    if music:
        musicQuestion = "The video is playing the music in the sheet music file. Make sure to give feedback based on the music they are playing from this"

    prompt = "Give individualized feedback on the video given to help the player. Feedback can include things about tone, style, rhythm, embouchure if they are playing a wind instrument, hand position if they are playing a string instrument, and any other music related feedback. Make the feedback very specific. Do not tell them to get private lessons. If something that is not music is uploaded so you can not process something that is not music"

    #then add into the content of like the questions we want to add 
    if questions:
        questions = "The player asked you to focus on " + questions

    TotalPrompt = musicQuestion + prompt + questions

    return TotalPrompt


    #pass the content into the mode
def analyzeVideo(video, music,  prompt):

    #for now working with inline and hoping that is faster
    client = genai.Client(api_key=api_key)


    video_bytes = open(video, 'rb').read()
    #video_bytes = video.read()

    videoContent = {'inline_data': {'mime_type':'video/mp4', 'data':video_bytes}}

    content = [videoContent]

#if there is music also give it to the model
    if music:
        #myMusic = client.files.upload(file = music)
        music_bytes = open(music,'rb').read()
        #music_bytes=music.read()
        musicContent = {'inline_data': {'mime_type':'application/pdf', 'data':music_bytes}}
        content.extend([musicContent, prompt])

    else:
        content.append(prompt)

    response = client.models.generate_content(
        model='gemini-2.0-flash', contents=content
    )

    return response.text


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)