export const logError = (error, context) => {
  console.error(`[${context}] Error:`, error);
  console.error('Stack:', error.stack);
  
  if (error.response) {
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
    console.error('Response headers:', error.response.headers);
  }
};

export const logInfo = (message, data) => {
  console.log(`[INFO] ${message}`, data);
};

export const logWarning = (message, data) => {
  console.warn(`[WARNING] ${message}`, data);
};