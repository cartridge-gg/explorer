import axios from "axios";

export default class API_CLIENT {
  baseURL;
  apiClient;
  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      withCredentials: false,
    });

    // FOR LOGGING REQUEST OBJECT
    // this.apiClient.interceptors.request.use((config = {}) => {
    //   console.log("API CONFIG:", config);
    //   return config;
    // });

    this.apiClient.interceptors.response.use(
      (response) => {
        // FOR LOGGING RESPONSE OBJECT
        // console.log("RESPONSE:", response);
        return Promise.resolve(response);
      },
      (error) => {
        // FOR LOGGING RESPONSE ERROR OBJECT
        console.error("ERROR:", {
          message: error.message,
          errorObject: error,
        });

        return Promise.reject(error);
      }
    );
  }

  get(url: string, params = {}, config = {}) {
    return this.apiClient.request({
      url,
      method: "get",
      ...config,
      params,
    });
  }

  post(url: string, data = {}, config = {}) {
    return this.apiClient.request({
      url,
      method: "post",
      data,
      ...config,
    });
  }

  patch(url: string, data = {}, config = {}) {
    return this.apiClient.request({
      url,
      method: "patch",
      data,
      ...config,
    });
  }

  del(url: string, data = {}, config = {}) {
    return this.apiClient.request({
      url,
      method: "delete",
      data,
      ...config,
    });
  }

  put(url: string, data = {}, config = {}) {
    return this.apiClient.request({
      url,
      method: "put",
      data,
      ...config,
    });
  }
}
