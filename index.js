require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.use(cors({
    origin: '*'
}));

const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/', 'index.html'));
});

app.post('/checkout', async (req, res) => {
    //extract all form data
    const { type, fname, email, amount } = req.body;
    console.log(req.body);

    // Create a new checkout session
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Donation for ${type} by ${fname}`,
                    },
                    unit_amount: amount * 100,
                },
                quantity: 1
            }
        ],
        mode: 'payment',
        success_url: `${process.env.BASE_URL}/complete?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.BASE_URL}/cancel`,
        customer_email: email,
    });

    // Return the session URL to the client
    res.json({ url: session.url });
});

app.get('/complete', async (req, res) => {
    const result = await Promise.all([
        stripe.checkout.sessions.retrieve(req.query.session_id, { expand: ['payment_intent.payment_method'] }),
        stripe.checkout.sessions.listLineItems(req.query.session_id),
    ]);

    res.send('Your payment was successful');
});

app.get('/cancel', (req, res) => {
    res.json.send({ cancelled: true });
});

app.listen(3000, () => console.log('Server started on port 3000'));
