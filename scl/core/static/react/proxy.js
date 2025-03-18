export default class ApiProxy {
  static getHeaders(token) {
    return {
      "Content-Type": "application/json",
      "X-CSRFToken": token,
    };
  }

  static async handleFetch(endpoint, requestOptions) {
    let data = {};
    let status = 500;
    try {
      const response = await fetch(endpoint, requestOptions);
      data = await response.json();
      status = response.status;
    } catch (error) {
      data = { message: "Cannot reach API server", error: error };
      status = 500;
    }
    return { data, status };
  }

  static async delete(endpoint, object, token) {
    const jsonData = JSON.stringify(object);
    const requestOptions = {
      method: "DELETE",
      headers: ApiProxy.getHeaders(token),
      body: jsonData,
    };
    return await ApiProxy.handleFetch(endpoint, requestOptions);
  }

  static async post(endpoint, object, token) {
    const jsonData = JSON.stringify(object);
    const requestOptions = {
      method: "POST",
      headers: ApiProxy.getHeaders(token),
      body: jsonData,
    };
    return await ApiProxy.handleFetch(endpoint, requestOptions);
  }

  static async update(endpoint, object, token) {
    const jsonData = JSON.stringify(object);
    const requestOptions = {
      method: "PATCH",
      headers: ApiProxy.getHeaders(token),
      body: jsonData,
    };
    return await ApiProxy.handleFetch(endpoint, requestOptions);
  }

  static async get(endpoint, token) {
    const requestOptions = {
      method: "GET",
      headers: ApiProxy.getHeaders(token),
    };
    return await ApiProxy.handleFetch(endpoint, requestOptions);
  }
}
