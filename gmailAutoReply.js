const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const { OAuth2Client } = require("google-auth-library");

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
];

const TOKEN_PATH = "token.json";

class GmailAutoReply {
  constructor() {
    this.gmail = null;
  }

  async authenticate() {
    try {
      const credentials = await this.loadClientSecrets();
      const oAuth2Client = await this.authorize(credentials);
      this.gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    } catch (error) {
      throw new Error(`Authentication failed: ${error}`);
    }
  }

  loadClientSecrets() {
    return new Promise((resolve, reject) => {
      fs.readFile("credentials.json", (err, content) => {
        if (err) return reject("Error loading client secret file");
        resolve(JSON.parse(content));
      });
    });
  }

  authorize(credentials) {
    return new Promise((resolve, reject) => {
      const { client_secret, client_id, redirect_uris } = credentials.installed;
      const oAuth2Client = new OAuth2Client(
        client_id,
        client_secret,
        redirect_uris[0]
      );

      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return this.getAccessToken(oAuth2Client, resolve, reject);
        oAuth2Client.setCredentials(JSON.parse(token));
        resolve(oAuth2Client);
      });
    });
  }

  getAccessToken(oAuth2Client, resolve, reject) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    console.log("Authorize this app by visiting this url:", authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question("Enter the code from that page here: ", (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return reject("Error retrieving access token");
        oAuth2Client.setCredentials(token);
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) console.error(err);
          console.log("Token stored to", TOKEN_PATH);
        });
        resolve(oAuth2Client);
      });
    });
  }

  async listMessages() {
    try {
      setInterval(async () => {
        const messages = await this.gmail.users.messages.list({ userId: "me" });
        if (messages.data.messages && messages.data.messages.length > 0) {
          for (const message of messages.data.messages) {
            const email = await this.gmail.users.messages.get({
              userId: "me",
              id: message.id,
            });
            await this.processEmail(email.data);
          }
        }
      }, this.getRandomInterval());
    } catch (error) {
      console.error("Error in listing messages:", error);
    }
  }

  async processEmail(email) {
    const messageId = email.id;
    const threadMessages = email.payload.headers;
    const sender = threadMessages.find(
      (header) => header.name === "From"
    ).value;

    const references = threadMessages.find(
      (header) => header.name === "References"
    );
    const hasReferences = references && references.value;

    const inReplyTo = threadMessages.find(
      (header) => header.name === "In-Reply-To"
    );
    const hasInReplyTo = inReplyTo && inReplyTo.value;

    if (!hasReferences && !hasInReplyTo) {
      try {
        await this.sendReply(sender, messageId);
        await this.addLabel(messageId, "VacationAutoReply");
        console.log("Auto-reply sent to:", sender);
      } catch (error) {
        console.error("Error processing email:", error);
      }
    }
  }

  async sendReply(to, messageId) {
    const message = this.createMessage(
      to,
      `Hello ${to},
      Thank you for reaching out! I'm currently out of the office and will get back to you as soon as possible.
      
      Best regards,
      Rohit Singh`
    );
    await this.gmail.users.messages.send({
      userId: "me",
      resource: {
        raw: Buffer.from(message).toString("base64"),
      },
      threadId: messageId,
    });
  }

  async addLabel(messageId, labelName) {
    try {
      const labelId = await this.createLabel(labelName);
      await this.gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        resource: {
          addLabelIds: [labelId],
        },
      });
    } catch (error) {
      console.error("Error adding label:", error);
    }
  }

  async createLabel(labelName) {
    const existingLabel = await this.getLabelByName(labelName);
    if (existingLabel) {
      return existingLabel.id;
    }

    const label = { name: labelName };
    const createdLabel = await this.gmail.users.labels.create({
      userId: "me",
      resource: label,
    });
    return createdLabel.data.id;
  }

  async getLabelByName(labelName) {
    const labels = await this.gmail.users.labels.list({ userId: "me" });
    const matchingLabel = labels.data.labels.find(
      (label) => label.name === labelName
    );
    return matchingLabel;
  }

  createMessage(to, messageText) {
    const message = [
      'Content-Type: text/plain; charset="UTF-8"\n',
      "MIME-Version: 1.0\n",
      `To: ${to}\n`,
      "Subject: Vacation Auto-Reply\n",
      "\n",
      messageText,
    ].join("");

    return message;
  }

  getRandomInterval() {
    return Math.floor(Math.random() * (120000 - 45000 + 1)) + 45000;
  }
}

module.exports = GmailAutoReply;
