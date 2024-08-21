import express from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

interface Webhook {
  id: string;
  url: string;
  events: string[];
}

let webhooks: Webhook[] = [];

// Endpoint to register a webhook
app.post('/webhooks', (req, res) => {
  const { url, events } = req.body;

  if (!url || !Array.isArray(events)) {
    return res.status(400).json({ message: 'Invalid request payload' });
  }

  const webhook: Webhook = {
    id: uuidv4(),
    url,
    events,
  };

  webhooks.push(webhook);
  res.status(201).json({ message: 'Webhook registered successfully', webhook });
});

// Endpoint to trigger events (this would typically be internal)
app.post('/trigger-event', (req, res) => {
  const { eventType, eventData } = req.body;

  if (!eventType || !eventData) {
    return res.status(400).json({ message: 'Invalid request payload' });
  }

  const payload = {
    eventType,
    timestamp: new Date().toISOString(),
    data: eventData,
  };

  webhooks
    .filter((webhook) => webhook.events.includes(eventType))
    .forEach((webhook) => {
      axios.post(webhook.url, payload)
        .then(() => {
          console.log(`Successfully sent ${eventType} to ${webhook.url}`);
        })
        .catch((error) => {
          console.error(`Failed to send ${eventType} to ${webhook.url}:`, error.message);
        });
    });

  res.status(200).json({ message: 'Event triggered successfully' });
});

// Endpoint to list registered webhooks
app.get('/webhooks', (req, res) => {
  res.json(webhooks);
});

// Endpoint to remove a webhook
app.delete('/webhooks/:id', (req, res) => {
  const { id } = req.params;
  webhooks = webhooks.filter((webhook) => webhook.id !== id);
  res.status(200).json({ message: 'Webhook removed successfully' });
});

// Example mock event data for an e-commerce site
const mockEvents = {
  add_to_cart: {
    product_id: '123',
    product_name: 'Sample Product',
    price: 29.99,
    currency: 'USD',
  },
  purchase: {
    order_id: '987',
    total_amount: 89.99,
    currency: 'USD',
    items: [
      { product_id: '123', product_name: 'Sample Product', quantity: 2, price: 29.99 },
      { product_id: '456', product_name: 'Another Product', quantity: 1, price: 29.99 },
    ],
  },
};

// Trigger mock events periodically (for demonstration purposes)
setInterval(() => {
  const eventType = 'add_to_cart';
  const eventData = mockEvents[eventType];
  
  axios.post(`http://localhost:${port}/trigger-event`, {
    eventType,
    eventData,
  });
}, 10000); // Trigger every 10 seconds

setInterval(() => {
  const eventType = 'purchase';
  const eventData = mockEvents[eventType];
  
  axios.post(`http://localhost:${port}/trigger-event`, {
    eventType,
    eventData,
  });
}, 30000); // Trigger every 30 seconds

app.listen(port, () => {
  console.log(`Google Analytics Mock service running on http://localhost:${port}`);
});