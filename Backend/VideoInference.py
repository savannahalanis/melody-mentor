import time
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
 

load_dotenv()
api_key = os.environ.get('geminikey')


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

    #myVideo = client.files.upload(file=video)

    video_bytes = open(video, 'rb').read()

    videoContent = {'inline_data': {'mime_type':'video/mp4', 'data':video_bytes}}

    content = [videoContent]

#if there is music also give it to the model
    if music:
        #myMusic = client.files.upload(file = music)
        music_bytes = open(music,'rb').read()
        videoContent = {'inline_data': {'mime_type':'application/pdf', 'data':music_bytes}}
        content.extend([videoContent, prompt])

    else:
        content.append(prompt)

    response = client.models.generate_content(
        model='gemini-2.0-flash', contents=content
    )

    return response.text


if __name__ == "__main__":
    video = 'practiceVideo.mp4'
    music = "score_0.pdf"
    prompt = makeQuestions(music, "")
    print(prompt)
    response = analyzeVideo(video, music, prompt)
    print(response)
