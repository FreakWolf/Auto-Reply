# Gmail Auto-Reply Bot

This Node.js application automatically replies to new emails in your Gmail inbox and adds a label to the thread.

## Features

1. Sends automatic replies to emails that have no prior replies.
2. Adds a label to the email thread and moves it to the label.
3. Customizable auto-reply message.
4. Avoids sending replies to emails that have been replied to before.

## Getting Started

### Prerequisites

1. Node.js and npm installed on your machine.
2. Gmail API credentials (credentials.json) and token storage (token.json). Follow the setup instructions below.

### Setup

1. Clone the repository:

    bash
    git clone https://github.com/FreakWolf/Auto-Reply.git
    

2. Install dependencies:

    bash
    cd Auto-Reply
    npm install
    

3. Set up Gmail API credentials:

    - Create a project in the [Google Cloud Console](https://console.developers.google.com/).
    - Enable the Gmail API for your project.
    - Create credentials and download the credentials.json file.
    - Place the credentials.json file in the project directory.

4. Authorize the application:

    - Run the application:

        bash
        node app.js
        

    - Follow the prompts to authorize the application with your Gmail account.

### Configuration

- Customize the auto-reply message in gmailAutoReply.js.

```javascript
const message = this.createMessage(
  to,
  `Hello ${to},
  Thank you for reaching out! I'm currently out of the office and will get back to you as soon as possible.
  
  Best regards,
  Your Name`
);