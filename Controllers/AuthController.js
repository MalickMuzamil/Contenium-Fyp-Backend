import jwt from "jsonwebtoken";

class AuthController {
  static generateResponse(status = 200, message = "", data = {}, token = null) {
    var response = {};

    response["status"] = status;
    response["data"] = data;
    response["message"] = message;
    if (token) {
      response["auth_token"] = token;
    }

    return response;
  }

  static generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
  };
}

export default AuthController;
