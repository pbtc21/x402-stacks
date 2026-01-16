# PR Template: Adding Stacks Support to Your x402 Project

Use this template when submitting PRs to add sBTC/STX support.

---

## PR Title

```
feat: add Stacks (sBTC) payment support
```

## PR Body

```markdown
## Summary

Adds Stacks blockchain support, enabling sBTC, STX, and USDCx payments alongside existing chains.

## Why Stacks?

- **sBTC**: 1:1 Bitcoin with trustless two-way peg
- **Fast**: ~10 min finality (Bitcoin-secured)
- **Cheap**: ~$0.001 per transaction
- **Growing**: Active x402 community at stacksx402.com

## Changes

- Adds `stacks:1` network identifier (CAIP-2)
- Integrates `@x402/stacks` for payment verification
- Supports: sBTC, STX, USDCx
- Zero breaking changes

## Token Contracts

| Token | Address |
|-------|---------|
| sBTC | `SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-sbtc` |
| STX | `native` |
| USDCx | `SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-susdc` |

## Testing

- [x] Unit tests added
- [x] Tested against Stacks mainnet
- [x] Backwards compatible with existing chains

## Example Usage

```typescript
import { verify, createPaymentRequirements } from '@x402/stacks';

// Return 402 with Stacks payment option
if (!payment) {
  return {
    status: 402,
    paymentRequirements: createPaymentRequirements(
      'SP2ZNG...', // recipient
      '10000',     // amount in smallest unit
      'sBTC'       // token
    )
  };
}

// Verify Stacks payment
const result = await verify({
  txId: payment.txId,
  network: 'stacks:1',
  token: payment.token,
  amount: '10000',
  recipient: 'SP2ZNG...',
});
```

---

Happy to iterate on feedback. Thanks for building x402!
```

---

## Code Diff Template

For projects using a facilitator pattern, add this to your network switch:

```diff
+ import stacksFacilitator from '@x402/stacks';

  const SUPPORTED_NETWORKS = [
    'eip155:8453',  // Base
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',  // Solana
+   'stacks:1',     // Stacks
  ];

  async function verifyPayment(payment) {
+   // Route Stacks payments
+   if (payment.network === 'stacks:1') {
+     return stacksFacilitator.verify(payment);
+   }

    // Existing verification logic
    // ...
  }
```

For projects with token configuration:

```diff
  const SUPPORTED_TOKENS = {
    'eip155:8453': ['USDC', 'ETH'],
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': ['USDC', 'SOL'],
+   'stacks:1': ['sBTC', 'STX', 'USDCx'],
  };
```

---

## Package.json Addition

```diff
  "dependencies": {
    "@x402/core": "^0.1.0",
    "@x402/evm": "^0.1.0",
    "@x402/svm": "^0.1.0",
+   "@x402/stacks": "^1.0.0"
  }
```
