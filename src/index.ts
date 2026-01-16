/**
 * @x402/stacks - Stacks blockchain support for x402 payments
 *
 * Verify sBTC, STX, and USDCx payments on Stacks.
 * Drop-in compatible with x402 facilitator interface.
 */

// =============================================================================
// CONSTANTS
// =============================================================================

export const STACKS_MAINNET = 'stacks:1';
export const STACKS_TESTNET = 'stacks:2147483648';

export const TOKENS = {
  sBTC: {
    address: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-sbtc',
    decimals: 8,
    symbol: 'sBTC',
  },
  STX: {
    address: 'native',
    decimals: 6,
    symbol: 'STX',
  },
  USDCx: {
    address: 'SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-susdc',
    decimals: 6,
    symbol: 'USDCx',
  },
} as const;

export type TokenSymbol = keyof typeof TOKENS;

const HIRO_API = 'https://api.hiro.so';

// =============================================================================
// TYPES
// =============================================================================

export interface PaymentRequirements {
  network: string;
  token: string;
  amount: string;
  recipient: string;
  extra?: {
    name: string;
    decimals: number;
  };
}

export interface Payment {
  txId: string;
  network: string;
  token: string;
  amount: string;
  recipient: string;
}

export interface VerifyResult {
  valid: boolean;
  txId?: string;
  error?: string;
}

export interface SettleResult {
  success: boolean;
  txId?: string;
  error?: string;
}

// =============================================================================
// PAYMENT REQUIREMENTS
// =============================================================================

/**
 * Create x402 PaymentRequirements for Stacks
 */
export function createPaymentRequirements(
  recipient: string,
  amount: string | bigint,
  token: TokenSymbol = 'sBTC'
): PaymentRequirements {
  const tokenInfo = TOKENS[token];

  return {
    network: STACKS_MAINNET,
    token: tokenInfo.address,
    amount: String(amount),
    recipient,
    extra: {
      name: tokenInfo.symbol,
      decimals: tokenInfo.decimals,
    },
  };
}

// =============================================================================
// VERIFICATION
// =============================================================================

/**
 * Verify a Stacks payment transaction
 */
export async function verify(payment: Payment): Promise<VerifyResult> {
  try {
    const { txId, recipient, amount, token } = payment;

    // Fetch transaction from Hiro API
    const res = await fetch(`${HIRO_API}/extended/v1/tx/${txId}`);

    if (!res.ok) {
      return { valid: false, error: `Transaction not found: ${txId}` };
    }

    const tx = await res.json();

    // Check transaction succeeded
    if (tx.tx_status !== 'success') {
      return { valid: false, error: `Transaction not successful: ${tx.tx_status}` };
    }

    // Native STX transfer
    if (token === 'native' || token === TOKENS.STX.address) {
      if (tx.tx_type !== 'token_transfer') {
        return { valid: false, error: 'Not a token transfer' };
      }

      const recipientMatch = tx.token_transfer.recipient_address === recipient;
      const amountMatch = BigInt(tx.token_transfer.amount) >= BigInt(amount);

      if (!recipientMatch) {
        return { valid: false, error: `Recipient mismatch: expected ${recipient}` };
      }
      if (!amountMatch) {
        return { valid: false, error: `Amount insufficient: got ${tx.token_transfer.amount}, need ${amount}` };
      }

      return { valid: true, txId };
    }

    // SIP-010 token transfer (sBTC, USDCx)
    if (tx.tx_type !== 'contract_call') {
      return { valid: false, error: 'Not a contract call' };
    }

    if (tx.contract_call.function_name !== 'transfer') {
      return { valid: false, error: 'Not a transfer function' };
    }

    // Normalize token address for comparison
    const expectedToken = token.toLowerCase();
    const actualToken = tx.contract_call.contract_id.toLowerCase();

    if (actualToken !== expectedToken) {
      return { valid: false, error: `Token mismatch: expected ${token}` };
    }

    // Parse function args: (amount uint) (sender principal) (recipient principal) (memo optional)
    const args = tx.contract_call.function_args;
    if (!args || args.length < 3) {
      return { valid: false, error: 'Invalid transfer arguments' };
    }

    const txAmount = BigInt(args[0].repr.replace('u', ''));
    const txRecipient = args[2].repr.replace(/'/g, '');

    if (txRecipient !== recipient) {
      return { valid: false, error: `Recipient mismatch: expected ${recipient}, got ${txRecipient}` };
    }

    if (txAmount < BigInt(amount)) {
      return { valid: false, error: `Amount insufficient: got ${txAmount}, need ${amount}` };
    }

    return { valid: true, txId };

  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    };
  }
}

/**
 * Settle a payment (for Stacks, verification IS settlement due to on-chain finality)
 */
export async function settle(payment: Payment): Promise<SettleResult> {
  const result = await verify(payment);

  if (result.valid) {
    return { success: true, txId: result.txId };
  }

  return { success: false, error: result.error };
}

// =============================================================================
// FACILITATOR INTERFACE
// =============================================================================

/**
 * x402 Facilitator-compatible interface
 */
export const facilitator = {
  /**
   * Supported networks
   */
  supportedNetworks: [STACKS_MAINNET, STACKS_TESTNET],

  /**
   * Supported tokens
   */
  supportedTokens: Object.values(TOKENS).map(t => t.address),

  /**
   * Verify a payment
   */
  verify,

  /**
   * Settle a payment
   */
  settle,

  /**
   * Get supported tokens for a network
   */
  getTokens(network: string) {
    if (network === STACKS_MAINNET || network === STACKS_TESTNET) {
      return Object.entries(TOKENS).map(([symbol, info]) => ({
        symbol,
        address: info.address,
        decimals: info.decimals,
      }));
    }
    return [];
  },
};

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Parse amount to smallest unit
 */
export function parseAmount(amount: string | number, token: TokenSymbol = 'sBTC'): bigint {
  const decimals = TOKENS[token].decimals;
  const [whole, fraction = ''] = String(amount).split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

/**
 * Format amount from smallest unit
 */
export function formatAmount(amount: bigint | string, token: TokenSymbol = 'sBTC'): string {
  const decimals = TOKENS[token].decimals;
  const str = String(amount).padStart(decimals + 1, '0');
  const whole = str.slice(0, -decimals) || '0';
  const fraction = str.slice(-decimals).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}

/**
 * Get token info by address
 */
export function getTokenByAddress(address: string): TokenSymbol | null {
  for (const [symbol, info] of Object.entries(TOKENS)) {
    if (info.address.toLowerCase() === address.toLowerCase()) {
      return symbol as TokenSymbol;
    }
  }
  return null;
}

// Default export for convenience
export default facilitator;
