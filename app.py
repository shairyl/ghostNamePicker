from flask import Flask, jsonify, request, make_response, send_from_directory
from flask_cors import CORS, cross_origin
from google.cloud import datastore
from google.auth.transport import requests as google_auth_requests
from google.oauth2 import id_token
import jwt
import datetime
from functools import wraps
import logging

app = Flask(__name__, static_url_path='', static_folder='build')
CORS(app, supports_credentials=True) 

datastore_client = datastore.Client()

""" For more security these need to be stored on Google Secret Manager! """
SECRET_KEY = 'a_very_secret_key_that_should_not_be_shared' 
CLIENT_ID = '956709761972-dl2k1mqc564o2bc13vdgrh8spr12v6e3.apps.googleusercontent.com'

@app.route("/")
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route("/api/auth", methods=["POST"])
def authenticate():
    token = request.json.get('token')  
    
    try:
        id_info = id_token.verify_oauth2_token(token, google_auth_requests.Request(), CLIENT_ID)
        user_id = id_info['sub']
        first_name = id_info.get('given_name', 'Unknown')
        last_name = id_info.get('family_name', 'Unknown')
        email = id_info.get('email', 'Unknown')

        # Check if user already exists
        user_key = datastore_client.key('Users', user_id)
        user = datastore_client.get(user_key)

        # If doesn't create a user in the database
        if not user:
            user = datastore.Entity(key=user_key)
            user.update({
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'ghostName': None 
            })
            datastore_client.put(user)
        
        # Token payload data
        payload = {
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
            'iat': datetime.datetime.utcnow(),
            'sub': user_id
        }
        
        # Encode JWT token
        encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        
        
        resp = make_response(jsonify({"message": "Authentication successful"}))
        
        # Set the new JWT in HttpOnly cookie
        resp.set_cookie('jwt_token', encoded_jwt, httponly=True, secure=True, samesite='Lax')
        return resp

    except ValueError:
        
        resp = make_response(jsonify({"error": "Invalid token"}), 401)
        resp.delete_cookie('jwt_token')
        return resp
    
def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.cookies.get('jwt_token')
        if not token:
            return jsonify({'message': 'Session token is missing!'}), 403

        try:
            decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user_id = decoded_token['sub']
            
            user_key = datastore_client.key('Users', current_user_id)
            current_user = datastore_client.get(user_key)
            if not current_user:
                raise ValueError('User not found')
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError) as e:
            return jsonify({'message': str(e)}), 401

        return f(current_user=current_user, *args, **kwargs)
    
    return decorated_function


@app.route('/api/ghostnames', methods=['GET'])
def get_ghost_names():
    
    query = datastore_client.query(kind='GhostNames')
    results = list(query.fetch())

    if results:        
        ghost_names = results[0]['GhostNames']
        return jsonify(ghost_names)
    else:
        return jsonify([]), 404

@app.route('/api/users-with-ghostnames', methods=['GET'])
def get_users_with_ghostnames():
    query = datastore_client.query(kind='Users')
    query.add_filter('ghostName', '!=', None)  
    results = list(query.fetch())

    users_with_ghostnames = [{
        'email': user.get('email', ''),
        'first_name': user.get('first_name', ''),
        'last_name': user.get('last_name', ''),
        'ghostName': user.get('ghostName', '')
    } for user in results if user.get('ghostName')]

    return jsonify(users_with_ghostnames)

@app.route('/api/update-ghostname', methods=['POST'])
@token_required
def update_ghostname(current_user):
    ghost_name = request.json.get('ghostName')
    if not ghost_name:
        return jsonify({'message': 'No ghost name provided'}), 400

    # Update the user entity with the new ghost name
    current_user['ghostName'] = ghost_name
    datastore_client.put(current_user)

    return jsonify({'message': 'Ghost name updated successfully'}), 200


@app.route('/api/logout', methods=['POST'])
def logout():
    
    resp = make_response(jsonify({"message": "You have been logged out"}))
    
    resp.set_cookie('jwt_token', '', expires=0, httponly=True, secure=True, samesite='Lax', path='/')
    return resp

@app.route('/api/check-session', methods=['GET'])
def check_session():
    
    token = request.cookies.get('jwt_token')
    if not token:
        return jsonify({'message': 'No active session'}), 401  

    
    try:
       
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = decoded['sub'] 
        
        # Retrieve the user entity from the Datastore
        user_key = datastore_client.key('Users', user_id)
        user = datastore_client.get(user_key)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404 
        
        
        email = user.get('email', 'Email not available')
        first_name = user.get('first_name', 'First name not available')
        last_name = user.get('last_name', 'Last name not available')
        ghostName = user.get('ghostName', 'Last name not available')
        
        return jsonify({
            'message': 'Session active',
            'user_id': user_id,
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'ghostName': ghostName
        }), 200

    except jwt.ExpiredSignatureError:
        # Token has expired
        return jsonify({'message': 'Session expired'}), 401  
    except jwt.InvalidTokenError:
        # Token is invalid for any other reason
        return jsonify({'message': 'Invalid session'}), 401 

if __name__ == '__main__':
    app.run()