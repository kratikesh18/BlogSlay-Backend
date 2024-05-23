// No need we wil figure it out later
import ApiError from '../Utils/ApiError.js'; // Adjust the path to your ApiError class

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      data: err.data,
    });
  }

  // Default to 500 server error
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    errors: [err.message],
  });
};

export default errorHandler;
