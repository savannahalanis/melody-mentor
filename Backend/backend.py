from flask import Flask
from flask_cors import CORS
from auth import auth_bp
from VideoInference import music_bp

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get('sessionkey')

# Enable CORS
CORS(app)  # This will allow all origins for all routes

# Register blueprints
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(music_bp, url_prefix="/music")

# Run the app
if __name__ == "__main__":
    app.run(debug=True)
