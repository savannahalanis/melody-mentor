from flask import Flask, request, jsonify, Blueprint
import jwt
import bcrypt
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from bson import ObjectId

auth_bp = Blueprint('auth', __name__)

load_dotenv()  # Load environment variables from .env file


# Load Mongo URI and JWT secret from environment variables
auth_bp = Blueprint('auth', __name__)
MONGO_URI = os.getenv("MONGO_URI")
JWT_SECRET = os.getenv("JWT_SECRET")

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client["melody-mentor-db"]  # Use the default database
users_collection = db.users  # Collection for users

# Register route
@auth_bp.route('/register', methods=['POST'])
def register():
    # data = request.get_json()
    data = request.form

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
    #making each user also hold memory
    users_collection.insert_one({
        "email": email,
        "username": username,
        "password": hashed_password,
        "memory": []
    })

    return jsonify({"message": "User registered successfully"}), 201

# Login route
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    # data = request.form

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

#also return a unique uername to be used
    return jsonify({
        "token": token,
        "userid": str(user['_id']),
        "username": user['username'],
        "email": user['email']
    }), 200

# Example protected route
@auth_bp.route('/protected', methods=['GET'])
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


@auth_bp.route('/profile', methods=['GET'])
def profile():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"error": "Token is missing!"}), 401

    try:
        # Remove "Bearer " from the token
        token = token.split(" ")[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = payload['user_id']
        
        # Get the user profile data from the database
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"error": "User not found!"}), 404

        return jsonify({
            "username": user["username"],
            "email": user["email"],
            "userID": str(user["_id"])
        }), 200
    
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
