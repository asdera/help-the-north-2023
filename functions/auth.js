const functions = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const axios = require("axios");
const cors = require("cors")({ origin: true });

exports.createBankClient = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      // Check for POST request
      if (request.method !== "POST") {
        return response.status(405).end(); // Method Not Allowed
      }

      // Extract name and email from request body
      const { name, email } = request.body;

      // Make an HTTP POST request to create a new client
      const apiResponse = await axios.post(
        "http://money-request-app.canadacentral.cloudapp.azure.com:8080/api/v1/client",
        {
          name,
          emailAddress: email,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Send the API response back to the client
      return response.status(200).send(apiResponse.data);
    } catch (error) {
      console.error("Error:", error);
      return response.status(500).send("Internal Server Error");
    }
  });
});

exports.registerUser = onCall(async (request) => {
  const data = request.data;

  const email = data.email;
  const password = data.password;
  const username = data.username;
  if (!(typeof username === "string")) {
    throw new HttpsError("invalid-argument", '"username" must be a string');
  }
  const username_re = /[a-zA-Z][a-zA-Z0-9]*/;
  if (!username_re.test(username)) {
    throw new HttpsError(
      "invalid-argument",
      '"username" must consist of alphanumeric characters only. The first character must be a letter'
    );
  }

  // create the user in the auth database
  let userRecord;
  try {
    userRecord = await getAuth().createUser({
      email: email,
      password: password,
    });
  } catch (error) {
    switch (error.code) {
      case "auth/invalid-email":
      case "auth/invalid-password":
      case "auth/missing-password":
      case "auth/email-already-exists":
        throw new HttpsError("invalid-argument", error.code);
      default:
        throw new HttpsError("internal", error.code);
    }
  }

  // create the user's profile
  const userId = userRecord.uid;
  try {
    await getFirestore()
      .collection("users")
      .doc(userId)
      .set({ email: email, username: username, joinDate: Timestamp.now() });
  } catch (error) {
    logger.error("failed to create a user profile for user: ", userId, error);
    throw new HttpsError("internal", error.code);
  }

  // send a email verification email
  try {
    // for some reason, the admin SDK doesn't support sending email verification emails directly. So we are forced to do this client side
  } catch (error) {
    logger.error(
      "failed to send email verification email to user: ",
      userId,
      error
    );
  }

  return userId;
});
