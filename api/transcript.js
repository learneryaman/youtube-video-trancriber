const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url, id } = req.query;

    if (!url && !id) {
      return res.status(400).json({
        error: 'Missing parameter. Please provide a video ID (?id=...) or YouTube URL (?url=...)'
      });
    }

    // Robustly extract the video ID from any YouTube URL format
    function extractVideoId(link) {
      if (!link) return null;
      if (link.length === 11 && !link.includes('http')) return link;
      
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?)|(shorts\/)|(live\/))\??v?=?([^#&?]*).*/;
      const match = link.match(regExp);
      return (match && match[9].length === 11) ? match[9] : link;
    }

    // Use the explicitly provided ID, or try to extract it from the URL
    const videoId = id || extractVideoId(url);

    // Fetch the transcript using just the video ID
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    // Combine all transcript segments into a single readable string
    const fullText = transcript.map(t => t.text).join(' ');

    return res.status(200).json({
      success: true,
      data: transcript,
      fullText: fullText
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return res.status(500).json({
      error: 'Failed to fetch transcript. Ensure the video has closed captions enabled and the URL is valid.',
      details: error.message
    });
  }
};
