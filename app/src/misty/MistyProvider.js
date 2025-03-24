import { MistyApi } from "./MistyWorker.js";

let mistyInstance = null;

const getMistyInstance = (ip) => {
  if (!mistyInstance && ip) {
    mistyInstance = new MistyApi(ip);
  }
  return mistyInstance;
};

export default getMistyInstance;