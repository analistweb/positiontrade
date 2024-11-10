import axios from 'axios';
import { COINGECKO_API_URL, getHeaders } from '../config/api';

export const fetchBitcoinDominance = async () => {
  const response = await axios.get(`${COINGECKO_API_URL}/global`);
  return response.data.data.market_cap_percentage.btc;
};

export const fetchPriceData = async () => {
  const coins = ['bitcoin', 'ethereum', 'dogecoin'];
  const promises = coins.map(coin => 
    axios.get(`${COINGECKO_API_URL}/coins/${coin}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: 30,
        interval: 'daily'
      },
      headers: getHeaders()
    })
  );

  const responses = await Promise.all(promises);
  const [btcData, ethData, dogeData] = responses;

  return btcData.data.prices.map((item, index) => ({
    name: new Date(item[0]).toLocaleDateString(),
    Bitcoin: item[1],
    Ethereum: ethData.data.prices[index][1],
    Dogecoin: dogeData.data.prices[index][1]
  }));
};