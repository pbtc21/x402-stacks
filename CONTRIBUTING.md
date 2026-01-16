# Contributing to @x402/stacks

Thanks for your interest in contributing!

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build
```

## Adding New Tokens

To add a new SIP-010 token, update `TOKENS` in `src/index.ts`:

```typescript
export const TOKENS = {
  // ... existing tokens
  NewToken: {
    address: 'SP....contract-address',
    decimals: 6,
    symbol: 'NEW',
  },
} as const;
```

## Submitting PRs

1. Fork the repo
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit PR with clear description

## Code Style

- TypeScript strict mode
- No `any` types
- Document public APIs with JSDoc

## Questions?

Open an issue or reach out on Twitter [@stacksx402](https://twitter.com/stacksx402).
