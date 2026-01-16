# @x402/stacks

Stacks blockchain support for x402 payments. Accept sBTC, STX, and USDCx.

[![npm version](https://img.shields.io/npm/v/@x402/stacks)](https://www.npmjs.com/package/@x402/stacks)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Stacks?

| Feature | Value |
|---------|-------|
| **sBTC** | 1:1 Bitcoin, trustless two-way peg |
| **Finality** | ~10 minutes (Bitcoin-secured) |
| **Fees** | ~$0.001 per transaction |
| **Ecosystem** | Growing x402 community at [stacksx402.com](https://stacksx402.com) |

## Install

```bash
npm install @x402/stacks
# or
bun add @x402/stacks
```

## Quick Start

### Server: Require Payment

```typescript
import { createPaymentRequirements } from '@x402/stacks';

app.get('/api/premium', (req, res) => {
  if (!req.headers['x-payment']) {
    return res.status(402).json({
      paymentRequirements: createPaymentRequirements(
        'SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS', // your address
        '10000',  // 0.0001 sBTC (8 decimals)
        'sBTC'
      )
    });
  }

  // ... verify and serve
});
```

### Server: Verify Payment

```typescript
import { verify } from '@x402/stacks';

const payment = JSON.parse(atob(req.headers['x-payment']));

const result = await verify({
  txId: payment.txId,
  network: 'stacks:1',
  token: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-sbtc',
  amount: '10000',
  recipient: 'SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS',
});

if (!result.valid) {
  return res.status(402).json({ error: result.error });
}

res.json({ data: 'premium content' });
```

### Use as Facilitator

```typescript
import facilitator from '@x402/stacks';

// Check supported networks
facilitator.supportedNetworks; // ['stacks:1', 'stacks:2147483648']

// Get available tokens
facilitator.getTokens('stacks:1');
// [{ symbol: 'sBTC', address: '...', decimals: 8 }, ...]

// Verify payment
await facilitator.verify(payment);

// Settle payment (on Stacks, verify = settle)
await facilitator.settle(payment);
```

## Supported Tokens

| Token | Contract | Decimals |
|-------|----------|----------|
| sBTC | `SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-sbtc` | 8 |
| STX | `native` | 6 |
| USDCx | `SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-susdc` | 6 |

## Utilities

```typescript
import { parseAmount, formatAmount, getTokenByAddress } from '@x402/stacks';

// Parse human-readable to smallest unit
parseAmount('0.001', 'sBTC');  // 100000n

// Format smallest unit to human-readable
formatAmount(100000n, 'sBTC'); // '0.001'

// Look up token by contract address
getTokenByAddress('SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-sbtc'); // 'sBTC'
```

## Network Identifiers (CAIP-2)

| Network | Identifier |
|---------|------------|
| Stacks Mainnet | `stacks:1` |
| Stacks Testnet | `stacks:2147483648` |

## Complete Example

```typescript
import Hono from 'hono';
import { createPaymentRequirements, verify } from '@x402/stacks';

const app = new Hono();

const RECIPIENT = 'SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS';
const PRICE = '10000'; // 0.0001 sBTC

app.get('/api/data', async (c) => {
  const paymentHeader = c.req.header('x-payment');

  // No payment? Return 402 with requirements
  if (!paymentHeader) {
    return c.json({
      paymentRequirements: createPaymentRequirements(RECIPIENT, PRICE, 'sBTC')
    }, 402);
  }

  // Verify payment
  const payment = JSON.parse(atob(paymentHeader));
  const result = await verify({
    txId: payment.txId,
    network: 'stacks:1',
    token: payment.token,
    amount: PRICE,
    recipient: RECIPIENT,
  });

  if (!result.valid) {
    return c.json({ error: result.error }, 402);
  }

  // Payment verified - serve content
  return c.json({
    data: 'premium content',
    paymentTx: result.txId
  });
});

export default app;
```

## Integration with Existing Facilitators

This package implements the standard x402 facilitator interface. To add Stacks support to an existing facilitator:

```typescript
import stacksFacilitator from '@x402/stacks';

// Add to your supported networks
const networks = [
  ...existingNetworks,
  ...stacksFacilitator.supportedNetworks,
];

// Route Stacks payments to this facilitator
if (payment.network.startsWith('stacks:')) {
  return stacksFacilitator.verify(payment);
}
```

## Links

- [x402 Protocol](https://x402.org)
- [Stacks x402 Community](https://stacksx402.com)
- [sBTC Documentation](https://docs.stacks.co/sbtc)
- [Hiro API](https://docs.hiro.so)

## License

MIT
