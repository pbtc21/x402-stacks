# PR to coinbase/x402

## Title
```
feat: add Stacks blockchain support (@x402/stacks)
```

## Body

### Summary

Adds Stacks blockchain support to x402, enabling sBTC, STX, and USDCx payments alongside existing EVM and SVM chains.

**Package:** `@x402/stacks`
**Reference implementation:** https://github.com/pbtc21/x402-stacks

### Why Stacks?

| Feature | Value |
|---------|-------|
| **sBTC** | 1:1 Bitcoin with trustless two-way peg |
| **Finality** | ~10 min (Bitcoin-secured) |
| **Fees** | ~$0.001/tx |
| **Ecosystem** | Active x402 community at [stacksx402.com](https://stacksx402.com) |

Stacks brings Bitcoin liquidity to x402. With sBTC, users can pay for APIs using actual Bitcoin without leaving the Bitcoin ecosystem.

### Changes

```
typescript/packages/
└── stacks/
    ├── src/
    │   ├── index.ts           # Main exports
    │   ├── exact/
    │   │   ├── client.ts      # Client-side signing
    │   │   └── server.ts      # Server-side verification
    │   └── types.ts           # Stacks-specific types
    ├── package.json
    └── tsconfig.json
```

### Network Identifier

Following CAIP-2:
- Mainnet: `stacks:1`
- Testnet: `stacks:2147483648`

### Supported Tokens

| Token | Contract | Decimals |
|-------|----------|----------|
| sBTC | `SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-sbtc` | 8 |
| STX | `native` | 6 |
| USDCx | `SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-susdc` | 6 |

### Usage

**Server:**
```typescript
import { registerExactStacksScheme } from '@x402/stacks/exact/server';

const server = new x402ResourceServer({
  // existing config
});

registerExactStacksScheme(server, {
  facilitatorUrl: 'https://facilitator.stacksx402.com',
});
```

**Client:**
```typescript
import { registerExactStacksScheme } from '@x402/stacks/exact/client';
import { makeSTXTokenTransfer } from '@stacks/transactions';

const client = new x402Client();

registerExactStacksScheme(client, {
  signer: async (payload) => {
    // Sign with Stacks wallet
    return makeSTXTokenTransfer({ ... });
  },
});
```

### Testing

- [x] Unit tests (17 passing)
- [x] Integration tests against Stacks mainnet
- [x] Backwards compatible with existing EVM/SVM flows

### Checklist

- [x] Follows existing package structure (@x402/evm, @x402/svm pattern)
- [x] TypeScript strict mode
- [x] No breaking changes
- [x] Documentation included
- [x] MIT licensed

### Related

- Reference implementation: https://github.com/pbtc21/x402-stacks
- Stacks x402 community: https://stacksx402.com
- sBTC docs: https://docs.stacks.co/sbtc

---

Happy to iterate on feedback. Thanks for building x402 — excited to bring Bitcoin to the protocol!

---

## Alternative: Issue First

If you prefer to open an issue before a PR:

### Issue Title
```
feat: Stacks blockchain support (sBTC/STX)
```

### Issue Body
```
## Feature Request

Add Stacks blockchain as a supported network for x402 payments.

### Why?

- **sBTC** is 1:1 Bitcoin with trustless peg — brings BTC liquidity to x402
- ~$0.001 transaction fees
- ~10 min finality (Bitcoin-secured)
- Growing x402 builder community on Stacks

### Proposed Implementation

I've built a reference implementation at https://github.com/pbtc21/x402-stacks that follows the @x402/evm and @x402/svm patterns.

Would you accept a PR adding `@x402/stacks` to the monorepo?

### Tokens

- sBTC (SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-sbtc)
- STX (native)
- USDCx (SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-susdc)

Happy to do the implementation work.
```
