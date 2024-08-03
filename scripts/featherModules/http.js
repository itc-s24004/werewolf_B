import { world } from "@minecraft/server";
import { HttpHeader, HttpRequest, HttpRequestMethod, HttpResponse, http } from "@minecraft/server-net";

const serverIP = `http://localhost:3000/`


export class request {
  #IP
  constructor(serverIP) {
    this.#IP = serverIP;
  };
  /**
   * 
   * @param {string} path 
   * @param {string} body 
   * @returns {Promise<HttpResponse>}
   */
  request(path, body) {
    const req = new HttpRequest(`${this.#IP}/${path}`);
    req.method = HttpRequestMethod.Post;
    req.body = JSON.stringify({content:body});
    req.headers = [
      new HttpHeader('Content-Type', 'application/json')
    ];
    req.timeout = 5;
    return http.request(req);
  };
};

export const discord = new request("http://192.168.11.65:3000");