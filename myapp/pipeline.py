from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

def save_google_user(backend, user, response, *args, **kwargs):
    if backend.name == 'google-oauth2':
        with transaction.atomic():
            # Update user details from Google
            if not user.first_name and response.get('name'):
                user.first_name = response.get('name', '').split()[0]
                user.last_name = ' '.join(response.get('name', '').split()[1:])
            
            if not user.email and response.get('email'):
                user.email = response.get('email')
            
            # Set default role for Google users
            if not user.role:
                user.role = 'user'
            
            # Save the user
            user.save() 