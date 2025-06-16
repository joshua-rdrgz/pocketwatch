import { env } from '@/config/env';
import axiosModule, { AxiosRequestConfig } from 'axios';

const axios = axiosModule.create({
  timeout: 5000,
});

export async function request(config: AxiosRequestConfig) {
  const response = await axios({ baseURL: env.API_BASE_URL, ...config });
  return response.data;
}
