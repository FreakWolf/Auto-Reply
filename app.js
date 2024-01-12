// app.js
const GmailAutoReply = require('./gmailAutoReply');

async function startApp() {
  const gmailAutoReply = new GmailAutoReply();
  try {
    await gmailAutoReply.authenticate();
    gmailAutoReply.listMessages();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

startApp();
