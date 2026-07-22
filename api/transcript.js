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

    // Fetch the transcript
    const transcript = await YoutubeTranscript.fetchTranscript(url);

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
