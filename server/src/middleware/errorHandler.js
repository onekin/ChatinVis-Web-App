export const errorHandler = (err, req, res, next) => {
  console.error('\n ERROR:', err.message);
  console.error('Stack:', err.stack);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // OpenAI API errors
  if (err.message && err.message.includes('OpenAI')) {
    console.error('OpenAI API Error detected');
    statusCode = 503;
    message = 'AI service temporarily unavailable: ' + err.message;
  }

  // Authentication errors
  if (err.message && err.message.includes('API key')) {
    console.error('API Key Error detected');
    statusCode = 503;
    message = 'AI service not configured properly';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
  }

  // Rate limit errors
  if (err.message && err.message.includes('rate limit')) {
    statusCode = 429;
    message = 'Too many requests, please try again later';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
