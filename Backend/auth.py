from flask import Flask, request, jsonify
import jwt
import bcrypt
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)

# Load Mongo URI and JWT secret from environment variables
MONGO_URI = os.getenv("MONGO_URI")
JWT_SECRET = os.getenv("JWT_SECRET")

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client.get_database()  # Use the default database
users_collection = db.users  # Collection for users

# Register route
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    if 'email' not in data or 'password' not in data or 'username' not in data:
        return jsonify({"error": "Email, password, and username are required"}), 400

    email = data['email']
    username = data['username']
    password = data['password']

    # Check if user already exists
    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email is already in use"}), 400
    if users_collection.find_one({"username": username}):
        return jsonify({"error": "Username is already in use"}), 400

    # Hash the password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # Insert user into the database
    users_collection.insert_one({
        "email": email,
        "username": username,
        "password": hashed_password,
    })

    return jsonify({"message": "User registered successfully"}), 201

# Login route
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if 'email' not in data or 'password' not in data:
        return jsonify({"error": "Email and password are required to log in"}), 400

    email = data['email']
    password = data['password']

    # Find user in the database
    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid email or password"}), 400

    # Check if the password matches
    if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({"error": "Invalid email or password"}), 400

    # Create JWT token
    token = jwt.encode({
        'user_id': str(user['_id']),
        'exp': datetime.utcnow() + timedelta(hours=1)  # Token expiration time
    }, JWT_SECRET, algorithm='HS256')

    return jsonify({"token": token}), 200

# Example protected route
@app.route('/protected', methods=['GET'])
def protected():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"error": "Token is missing!"}), 401

    try:
        # Remove "Bearer " from the token
        token = token.split(" ")[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = payload['user_id']
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

    return jsonify({"message": f"Hello user {user_id}"})

if __name__ == '__main__':
    app.run(debug=True)
