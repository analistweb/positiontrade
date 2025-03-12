
import axios from 'axios';
import { setupInterceptors } from './apiInterceptors';

// Base API URLs
export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
export const BLOCKCHAIN_API_URL = 'https://api.blockchain.info';

// Common headers for API requests
export const getHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json'
});

// Create axios instance with defaults for CoinGecko
export const axiosInstance = axios.create({
  baseURL: COINGECKO_API_URL,
  timeout: 8000, // 8 segundos
  headers: getHeaders()
});

// Create axios instance for blockchain.com API
export const blockchainInstance = axios.create({
  baseURL: BLOCKCHAIN_API_URL,
  timeout: 8000,
  headers: getHeaders()
});

// Setup interceptors for both instances
setupInterceptors(axiosInstance, 'coingecko');
setupInterceptors(blockchainInstance, 'blockchain');
