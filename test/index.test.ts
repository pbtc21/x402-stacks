import { describe, it, expect } from 'bun:test';
import {
  verify,
  settle,
  createPaymentRequirements,
  parseAmount,
  formatAmount,
  getTokenByAddress,
  TOKENS,
  STACKS_MAINNET,
  facilitator,
} from '../src/index';

describe('@x402/stacks', () => {

  describe('createPaymentRequirements', () => {
    it('creates sBTC payment requirements', () => {
      const req = createPaymentRequirements(
        'SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS',
        '10000',
        'sBTC'
      );

      expect(req.network).toBe(STACKS_MAINNET);
      expect(req.token).toBe(TOKENS.sBTC.address);
      expect(req.amount).toBe('10000');
      expect(req.recipient).toBe('SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS');
      expect(req.extra?.decimals).toBe(8);
    });

    it('creates STX payment requirements', () => {
      const req = createPaymentRequirements(
        'SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS',
        '1000000',
        'STX'
      );

      expect(req.token).toBe('native');
      expect(req.extra?.decimals).toBe(6);
    });

    it('accepts bigint amounts', () => {
      const req = createPaymentRequirements(
        'SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS',
        BigInt(10000),
        'sBTC'
      );

      expect(req.amount).toBe('10000');
    });
  });

  describe('parseAmount', () => {
    it('parses sBTC amounts (8 decimals)', () => {
      expect(parseAmount('1', 'sBTC')).toBe(100000000n);
      expect(parseAmount('0.1', 'sBTC')).toBe(10000000n);
      expect(parseAmount('0.00000001', 'sBTC')).toBe(1n);
      expect(parseAmount('1.5', 'sBTC')).toBe(150000000n);
    });

    it('parses STX amounts (6 decimals)', () => {
      expect(parseAmount('1', 'STX')).toBe(1000000n);
      expect(parseAmount('0.1', 'STX')).toBe(100000n);
      expect(parseAmount('0.000001', 'STX')).toBe(1n);
    });
  });

  describe('formatAmount', () => {
    it('formats sBTC amounts', () => {
      expect(formatAmount(100000000n, 'sBTC')).toBe('1');
      expect(formatAmount(10000000n, 'sBTC')).toBe('0.1');
      expect(formatAmount(1n, 'sBTC')).toBe('0.00000001');
      expect(formatAmount(150000000n, 'sBTC')).toBe('1.5');
    });

    it('formats STX amounts', () => {
      expect(formatAmount(1000000n, 'STX')).toBe('1');
      expect(formatAmount(100000n, 'STX')).toBe('0.1');
    });
  });

  describe('getTokenByAddress', () => {
    it('finds sBTC by address', () => {
      expect(getTokenByAddress(TOKENS.sBTC.address)).toBe('sBTC');
    });

    it('finds STX by native', () => {
      expect(getTokenByAddress('native')).toBe('STX');
    });

    it('returns null for unknown', () => {
      expect(getTokenByAddress('SP123.unknown-token')).toBeNull();
    });

    it('is case-insensitive', () => {
      expect(getTokenByAddress(TOKENS.sBTC.address.toUpperCase())).toBe('sBTC');
    });
  });

  describe('facilitator interface', () => {
    it('exposes supported networks', () => {
      expect(facilitator.supportedNetworks).toContain(STACKS_MAINNET);
    });

    it('exposes supported tokens', () => {
      expect(facilitator.supportedTokens).toContain(TOKENS.sBTC.address);
      expect(facilitator.supportedTokens).toContain('native');
    });

    it('returns tokens for stacks network', () => {
      const tokens = facilitator.getTokens(STACKS_MAINNET);
      expect(tokens.length).toBe(3);
      expect(tokens.map(t => t.symbol)).toContain('sBTC');
    });

    it('returns empty for unknown network', () => {
      const tokens = facilitator.getTokens('unknown:1');
      expect(tokens.length).toBe(0);
    });
  });

  describe('verify', () => {
    it('rejects non-existent transaction', async () => {
      const result = await verify({
        txId: '0x0000000000000000000000000000000000000000000000000000000000000000',
        network: STACKS_MAINNET,
        token: TOKENS.sBTC.address,
        amount: '1000',
        recipient: 'SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('settle', () => {
    it('returns success false for invalid payment', async () => {
      const result = await settle({
        txId: '0x0000000000000000000000000000000000000000000000000000000000000000',
        network: STACKS_MAINNET,
        token: TOKENS.sBTC.address,
        amount: '1000',
        recipient: 'SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS',
      });

      expect(result.success).toBe(false);
    });
  });

});
