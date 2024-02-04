import express from 'express';
import { port } from './config/index.js';
import loader from './loaders/index.js';
import path from 'path'
import helmet from 'helmet';
const app = express();

// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       scriptSrc: ["'self'", "'unsafe-inline'", "your other script sources here"],
//       // Add other CSP directives as needed for your application
//     },
//   })
// );




app.set('view engine', 'ejs');
app.use(express.static('public'));
loader(app);

app.get('/x',(req,res)=>{
  res.render('card')
})
app.get('/x2',(req,res)=>{
  res.render('new1')
})
app.get('/x3',(req,res)=>{
  res.render('notFound2')
})
app.get('/x1',(req,res)=>{res.render('index1')});
app.get("/success", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Payment Successful</title>
        <script>
          alert("Payment Successful! Redirecting to manage subscriptions...");
          setTimeout(function() {
            window.location.href = "/manage-subscription";
          }, 3000); // Redirect after 3 seconds
        </script>
      </head>
      <body>
        <h1>Payment Successful!</h1>
        <p>You will be redirected shortly...</p>
      </body>
    </html>
  `);
});

app.get("/cancel", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Payment Canceled</title>
        <script>
          alert("Payment was canceled. You will be redirected to the homepage.");
          setTimeout(function() {
            window.location.href = "/";
          }, 3000); // Redirect after 3 seconds
        </script>
      </head>
      <body>
        <h1>Payment Canceled</h1>
        <p>Redirecting to the homepage...</p>
      </body>
    </html>
  `);
});


app.listen(port, err => {
  if (err) {
    console.log(err);
    return process.exit(1);
  }
  console.log(`Server is running on ${port}`);
});





// Webhook to handle post-payment logic
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
      event = stripe.webhooks.constructEvent(req.body, sig, 'your_stripe_webhook_secret');
  } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
  }

  // Handle successful checkout session
  if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      try {
          const customer_id = session.customer;
          const subscription_id = session.subscription;

          // Save subscription details to your database
          const newSubscription = new Subscription({
              business: customer_id, // Assuming business model has a reference to customer_id
              stripeSubscriptionId: subscription_id,
              status: "active" // or other relevant fields
          });
          await newSubscription.save();

          // Success response
          res.json({ received: true });
      } catch (error) {
          // If saving to DB fails, consider refunding
          await stripe.refunds.create({
              charge: session.latest_invoice.payment_intent.charges.data[0].id
          });

          // Send failure email
          const mailOptions = {
              from: 'your_email_address',
              to: 'customer_email', // You need to obtain customer's email address
              subject: 'Subscription Creation Failed',
              text: 'Your subscription could not be processed. We have issued a refund.'
          };
          transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                  console.log(error);
              } else {
                  console.log('Email sent: ' + info.response);
              }
          });

          res.status(500).json({ error: error.message });
      }
  } else {
      // Handle other event types
      res.json({ received: true });
  }
});
// app.post('/webhook', express.json({type: 'application/json'}), (request, response) => {
//   const event = request.body;

//   switch (event.type) {
//       case 'checkout.session.completed':
//           const session = event.data.object;
//           // Handle successful checkout session completion
//           // e.g., update user subscription status in your database
//           break;
//       case 'invoice.paid':
//           // Handle successful payment of an invoice
//           break;
//       case 'invoice.payment_failed':
//           // Handle payment failure
//           break;
//       // Add more event types as needed
//   }

//   // Return a response to acknowledge receipt of the event
//   response.status(200).json({received: true});
// });

export default app