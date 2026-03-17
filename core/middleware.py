from django.utils.cache import add_never_cache_headers
from django.utils import timezone
from django.contrib import auth
from django.shortcuts import redirect
import uuid

# Unique token generated whenever the Django process starts
BOOT_TOKEN = uuid.uuid4().hex


class NoCacheMiddleware:
    """
    BUG-10 Fix: Aggressively prevent browser/Electron from caching
    authenticated pages. Adds multiple cache-busting headers to ensure
    the Back button shows the login page after logout.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.user.is_authenticated:
            add_never_cache_headers(response)
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
        return response


class MidnightPurgeMiddleware:
    """
    Beta 2.2.1 Refinement: Force logout all users between 23:59 and 00:01.
    Ensures end-of-day security compliance and prevents stagnant sessions.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            now = timezone.localtime(timezone.now())
            # Check if current time is between 23:59:00 and 00:01:00
            current_time = now.time()
            purge_start = timezone.datetime.strptime("23:59:00", "%H:%M:%S").time()
            purge_end = timezone.datetime.strptime("00:01:00", "%H:%M:%S").time()
            
            # Time comparison: current_time >= 23:59:00 OR current_time <= 00:01:00
            if current_time >= purge_start or current_time <= purge_end:
                auth.logout(request)
                return redirect('core:login')

        response = self.get_response(request)
        return response

class SecurityBootFlushMiddleware:
    """
    Alpha 2.2.3: Force session invalidation on server reboot.
    Checks a unique process-level BOOT_TOKEN against the session.
    If they mismatch, the user is logged out.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            # Get the token associated with this session
            session_boot_token = request.session.get('server_boot_token')
            
            # If token is missing or doesn't match current process token
            if session_boot_token != BOOT_TOKEN:
                # Flush the session but keep the new token
                auth.logout(request)
                request.session['server_boot_token'] = BOOT_TOKEN
                return redirect('core:login')

        # Otherwise, ensure current token is in session for authenticated users
        elif not request.user.is_authenticated:
             # Just in case, ensure token is refreshed on next login
             pass

        response = self.get_response(request)
        
        # After successful login/response, ensure token is set
        if request.user.is_authenticated and 'server_boot_token' not in request.session:
            request.session['server_boot_token'] = BOOT_TOKEN
            
        return response
