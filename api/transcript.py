from http.server import BaseHTTPRequestHandler
import urllib.parse
import json
import re
from youtube_transcript_api import YouTubeTranscriptApi

def extract_video_id(link):
    if not link:
        return None
    if len(link) == 11 and "http" not in link:
        return link
    
    # Regex to extract video ID
    match = re.search(r'(?:youtu\.be\/|v\/|\/u\/\w\/|embed\/|watch\?v=|shorts\/|live\/|v=)([^#&?]*).*', link)
    if match and len(match.group(1)) == 11:
        return match.group(1)
    return link

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed_path.query)
        
        url_param = query.get('url', [None])[0]
        id_param = query.get('id', [None])[0]
        
        video_id = id_param or extract_video_id(url_param)
        
        if not video_id:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Missing parameter. Please provide ?id=..."}).encode('utf-8'))
            return
            
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            full_text = ' '.join([t['text'] for t in transcript_list])
            
            response = {
                "success": True,
                "data": transcript_list,
                "fullText": full_text
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": "Failed to fetch transcript.",
                "details": str(e)
            }).encode('utf-8'))
