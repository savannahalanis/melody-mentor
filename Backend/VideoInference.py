import time
import os
import uuid
from dotenv import load_dotenv
from google import genai
from google.genai import types
from flask import Flask, request, session, jsonify, Blueprint
from flask_cors import CORS
from pymongo import MongoClient #to work with MongoDB
from auth import users_collection
from bson import ObjectId
#this will allow me to access the database

load_dotenv()
api_key = os.environ.get('geminikey')

#set up the Flask route 
music_bp = Blueprint('music', __name__)

 #for now working with inline and hoping that is faster
clientGem = genai.Client(api_key=api_key)


#if you make this a posat request everytime you submit your music then itll just get overriden each time which is good 
#using sessions will let you just chat with the bot which should make that part faster!
@music_bp.route("/startSession", methods=['POST'])
def start_session():

    #can end session this way
    if session.get('session_id') and session.get('history'):
        userID = request.form['userid']
        formatted_history = session.get('history')
        session_data = clientGem.models.generate_content(
        model='gemini-2.0-flash', contents=['Summarize this history for future sessions. This is advice on playing music properly. This will be used to guide the same user in the future', formatted_history]
    )
        users_collection.update_one(
            {"_id": ObjectId(userID)},
            {"$push": {"memory": session_data}}  # Add session data to the user's memory field
        )

        #Clear the previous session
        session.clear()

        
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
    
    #create an empty session history to use 
    session['history'] = ""
    return jsonify({"message": f"Session started! Video saved as {video_path}"}), 200


@music_bp.route("/getAdvice", methods=['POST'])
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

    # Add the question and response to the session history
    session['history'] += f"Question: {question}\nResponse: {response}\n\n"

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

    prompt = "Give individualized feedback on the video given to help the player. Feedback can include things about tone, style, rhythm, embouchure if they are playing a wind instrument, hand position if they are playing a string instrument, and any other music related feedback. Make the feedback very specific. Do not tell them to get private lessons. If something that is not music is uploaded so you can not process something that is not music. Please just give on nice and easy to read paragraph. "

    #then add into the content of like the questions we want to add 
    if questions:
        questions = "The player asked you to focus on " + questions

    TotalPrompt = musicQuestion + prompt + questions

    return TotalPrompt


    #pass the content into the mode
def analyzeVideo(video, music,  prompt):


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

    content.append("This is the history of this specific session. You can use this if anything in here is useful" + session.get('history'))

    user = users_collection.find_one(
            {"_id": ObjectId(request.form['userid'])}  # Add session data to the user's memory field
        )

    if not user:
        return {"error": "User not found."}, 404

    history = user.get('history', [])

    # Optionally, you can format the history as a giant string
    history_str = "These are things that happened in past sessions. These are probably less important but you can use them"
    for entry in history:
        history_str += f"Question: {entry['question']}\nResponse: {entry['response']}\n\n"

    content.append(history_str)

    response = clientGem.models.generate_content(
        model='gemini-2.0-flash', contents=content
    )

    return response.text



@music_bp.route("/endSession", methods=['POST'])
def end_session():
    #can end session this way
    if session.get('session_id') and session.get('history'):
        userID = request.form['userid']
        formatted_history = session.get('history')
        session_data = clientGem.models.generate_content(
        model='gemini-2.0-flash', contents=['Summarize this history for future sessions. This is advice on playing music properly. This will be used to guide the same user in the future', formatted_history]
    )
        users_collection.update_one(
            {"_id": ObjectId(userID)},
            {"$push": {"memory": session_data.text}}  # Add session data to the user's memory field
        )

    # Clear the session after updating
    session.clear()


    return {"message": "Session Ended Succesfully"}, 200
