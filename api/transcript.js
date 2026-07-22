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
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: 'Missing URL parameter. Please provide a YouTube URL (e.g. ?url=https://youtube.com/watch?v=...)'
      });
    }

    // Robustly extract the video ID from any YouTube URL format (watch, shorts, live, youtu.be)
    function extractVideoId(link) {
      // If it's already an 11 character ID, just return it
      if (link.length === 11 && !link.includes('http')) return link;
      
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?)|(shorts\/)|(live\/))\??v?=?([^#&?]*).*/;
      const match = link.match(regExp);
      return (match && match[9].length === 11) ? match[9] : link;
    }

    const videoId = extractVideoId(url);

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
