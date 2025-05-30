import axiosModule, { AxiosRequestConfig } from 'axios';

const axios = axiosModule.create({
  timeout: 5000,
});

export async function request(config: AxiosRequestConfig) {
  const response = await axios({ ...config });
  return response.data;
}
