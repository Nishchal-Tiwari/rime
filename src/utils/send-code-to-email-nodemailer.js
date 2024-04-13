import nodemailer from "nodemailer";



const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: "saanalytics.work@gmail.com",
    pass: "qsdhufxjulczdgro",
  },
});


const goDaddyMailTransporter = nodemailer.createTransport({    
  host: "smtpout.secureserver.net",  
  secure: true,
  secureConnection: false, // TLS requires secureConnection to be false
  tls: {
      ciphers:'SSLv3'
  },
  requireTLS:true,
  port: 465,
  debug: true,
  auth: {
      user: "verification@rime.co.in",
      pass: "Iamvimal123@" 
  }
});

export default async function main(to,confirmationLink,name) {
  // send mail with defined transport object
  let message = {
    from: ` RIME < no-reply@rime.ac.in>`, // sender address
    to: ` ${name}  <${to}>`, // list of receivers
    subject: "Verify Your Account", // Subject line
    text: "Verification Link From Rime", // plain text body
    html: `${gmailHTML(confirmationLink)}`, // html body
    // attachments: [
    //   {   // utf-8 string as an attachment  for more refer nodemailer documentation  LINK : https://nodemailer.com/message/attachments/
    //       filename: 'text1.txt',
    //       content: 'hello world!'
    //   },
    // ]
  }
  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  //
  // NOTE: You can go to https://forwardemail.net/my-account/emails to see your email delivery status and preview
  //       Or you can use the "preview-email" npm package to preview emails locally in browsers and iOS Simulator
  //       <https://github.com/forwardemail/preview-email>
  //
}

// async..await is not allowed in global scope, must use a wrapper





function gmailHTML(link){
  return `
<!DOCTYPE html>
<html>
<head>
<title>Verification Email</title>
<style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f4f4f4;
    color: #333;
    line-height: 1.6;
  }

  .container {
    max-width: 600px;
    margin: 20px auto;
    padding: 20px;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .button {
    display: inline-block;
    padding: 10px 20px;
    background-color: #007bff;
    color: #fff;
    text-decoration: none;
    border-radius: 5px;
    transition: background-color 0.3s;
    text-align: center;
  }

  .button:hover {
    background-color: #0056b3;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .animated {
    animation: fadeIn 2s;
  }
</style>
</head>
<body>
  <div class="container animated">
    <h2>Welcome to RIME</h2>
    <p>Thank you for signing up with RIME. Please confirm your email address by clicking on the link below:</p>
    <a href="${link}" class="button">Verify Email</a>
    <p>If you did not create an account with RIME, please ignore this email.</p>
  </div>
</body>
</html>

`
}