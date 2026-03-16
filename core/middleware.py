from django.utils.cache import add_never_cache_headers


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
