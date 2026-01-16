/**
 * Example: x402 payment gate with Stacks (sBTC)
 *
 * Run: bun run examples/hono-server.ts
 */

import { Hono } from 'hono';
import { createPaymentRequirements, verify, formatAmount } from '@x402/stacks';

const app = new Hono();

// Your Stacks address to receive payments
const RECIPIENT = 'SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS';

// Price: 0.0001 sBTC (10000 sats)
const PRICE = '10000';

app.get('/', (c) => {
  return c.json({
    name: 'x402 Stacks Example',
    endpoints: {
      '/free': 'Free endpoint',
      '/premium': `Premium endpoint (${formatAmount(PRICE, 'sBTC')} sBTC)`,
    },
  });
});

// Free endpoint
app.get('/free', (c) => {
  return c.json({ message: 'This is free!' });
});

// Premium endpoint - requires sBTC payment
app.get('/premium', async (c) => {
  const paymentHeader = c.req.header('x-payment');

  // No payment header? Return 402 with requirements
  if (!paymentHeader) {
    return c.json(
      {
        error: 'Payment Required',
        paymentRequirements: createPaymentRequirements(RECIPIENT, PRICE, 'sBTC'),
      },
      402
    );
  }

  // Parse and verify payment
  try {
    const payment = JSON.parse(atob(paymentHeader));

    const result = await verify({
      txId: payment.txId,
      network: 'stacks:1',
      token: payment.token,
      amount: PRICE,
      recipient: RECIPIENT,
    });

    if (!result.valid) {
      return c.json(
        {
          error: 'Payment Invalid',
          reason: result.error,
          paymentRequirements: createPaymentRequirements(RECIPIENT, PRICE, 'sBTC'),
        },
        402
      );
    }

    // Payment verified! Serve premium content
    return c.json({
      message: 'Welcome to premium content!',
      paymentVerified: true,
      txId: result.txId,
      data: {
        secret: 'The answer is 42',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (e) {
    return c.json(
      {
        error: 'Payment Error',
        reason: e instanceof Error ? e.message : 'Unknown error',
      },
      400
    );
  }
});

export default app;

// For local testing
// Bun.serve({ fetch: app.fetch, port: 3000 });
// console.log('Server running at http://localhost:3000');
