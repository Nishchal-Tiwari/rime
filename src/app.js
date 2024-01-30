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





app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        let userEmail = session.customer_email;

        if (!userEmail) {
          const customer = await stripe.customers.retrieve(session.customer);
          userEmail = customer.email;
        }

        if (!userEmail) {
          console.error("User email not found in session or customer object");
          return response.status(400).send("Email not found");
        }

        const subscriptionId = session.subscription;
        const customerId = session.customer;
        let planId = null;

        // Fetch the subscription to get the plan ID
        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId
        );
        if (
          subscription &&
          subscription.items &&
          subscription.items.data.length > 0
        ) {
          planId = subscription.items.data[0].plan.id;
        }

        let userRef = db.collection("users").doc(userEmail);
        await userRef.update({
          // stripeCustomerId: customerId,
          // subscriptionId: subscriptionId,
          subscriptionStatus: "active",
          subscribedPlanId: planId,
        });
      } else if (
        event.type === "customer.subscription.updated" ||
        event.type === "customer.subscription.deleted"
      ) {
        const subscription = event.data.object;
        let userEmail = subscription.customer_email;

        if (!userEmail) {
          const customer = await stripe.customers.retrieve(
            subscription.customer
          );
          userEmail = customer.email;
        }

        const subscriptionId = subscription.id;
        const planId = subscription.items.data[0].plan.id;
        const subscriptionStatus =
          event.type === "customer.subscription.deleted"
            ? "cancelled"
            : "active";

        let userRef = db.collection("users").doc(userEmail);
        await userRef.update({
          subscriptionId: subscriptionId,
          subscriptionStatus: subscriptionStatus,
          subscribedPlanId: planId,
        });
      }

      response.json({ received: true });
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      response.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);
export default app