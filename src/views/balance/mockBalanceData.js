// Mock data for testing coin/network display
export const MOCK_COINS = [
  // BTC variants
  { id: 1, coin: { id: 1, symbol: 'BTC', name: 'Bitcoin', logoUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' }, network: { id: 1, symbol: 'BTC', name: 'Bitcoin' } },
  { id: 2, coin: { id: 1, symbol: 'BTC', name: 'Bitcoin', logoUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' }, network: { id: 14, symbol: 'LN', name: 'Lightning' } },
  { id: 4, coin: { id: 1, symbol: 'BTC', name: 'Bitcoin', logoUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' }, network: { id: 3, symbol: 'BSC', name: 'BNB Smart Chain' } },
  { id: 5, coin: { id: 1, symbol: 'BTC', name: 'Bitcoin', logoUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' }, network: { id: 2, symbol: 'ETH', name: 'Ethereum' } },
  
  // ETH variants
  { id: 6, coin: { id: 2, symbol: 'ETH', name: 'Ethereum', logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' }, network: { id: 2, symbol: 'ETH', name: 'Ethereum' } },
  { id: 7, coin: { id: 2, symbol: 'ETH', name: 'Ethereum', logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' }, network: { id: 3, symbol: 'BSC', name: 'BNB Smart Chain' } },
  { id: 8, coin: { id: 2, symbol: 'ETH', name: 'Ethereum', logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' }, network: { id: 7, symbol: 'ARB', name: 'Arbitrum' } },
  { id: 9, coin: { id: 2, symbol: 'ETH', name: 'Ethereum', logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' }, network: { id: 8, symbol: 'BASE', name: 'Base' } },
  { id: 10, coin: { id: 2, symbol: 'ETH', name: 'Ethereum', logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' }, network: { id: 9, symbol: 'OP', name: 'Optimism' } },
  { id: 11, coin: { id: 2, symbol: 'ETH', name: 'Ethereum', logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' }, network: { id: 10, symbol: 'MATIC', name: 'Polygon' } },
  
  // USDT variants (many networks)
  { id: 15, coin: { id: 3, symbol: 'USDT', name: 'Tether USD', logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png' }, network: { id: 2, symbol: 'ETH', name: 'Ethereum' } },
  { id: 16, coin: { id: 3, symbol: 'USDT', name: 'Tether USD', logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png' }, network: { id: 3, symbol: 'BSC', name: 'BNB Smart Chain' } },
  { id: 17, coin: { id: 3, symbol: 'USDT', name: 'Tether USD', logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png' }, network: { id: 6, symbol: 'TRX', name: 'TRON' } },
  { id: 18, coin: { id: 3, symbol: 'USDT', name: 'Tether USD', logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png' }, network: { id: 4, symbol: 'MATIC', name: 'Polygon' } },
  { id: 19, coin: { id: 3, symbol: 'USDT', name: 'Tether USD', logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png' }, network: { id: 7, symbol: 'ARB', name: 'Arbitrum' } },
  { id: 20, coin: { id: 3, symbol: 'USDT', name: 'Tether USD', logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png' }, network: { id: 8, symbol: 'BASE', name: 'Base' } },
  { id: 21, coin: { id: 3, symbol: 'USDT', name: 'Tether USD', logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png' }, network: { id: 10, symbol: 'OP', name: 'Optimism' } },
  { id: 23, coin: { id: 3, symbol: 'USDT', name: 'Tether USD', logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png' }, network: { id: 5, symbol: 'SOL', name: 'Solana' } },
  { id: 26, coin: { id: 3, symbol: 'USDT', name: 'Tether USD', logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png' }, network: { id: 18, symbol: 'TON', name: 'TON' } },
  
  // USDC variants
  { id: 34, coin: { id: 4, symbol: 'USDC', name: 'USD Coin', logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' }, network: { id: 2, symbol: 'ETH', name: 'Ethereum' } },
  { id: 35, coin: { id: 4, symbol: 'USDC', name: 'USD Coin', logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' }, network: { id: 3, symbol: 'BSC', name: 'BNB Smart Chain' } },
  { id: 36, coin: { id: 4, symbol: 'USDC', name: 'USD Coin', logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' }, network: { id: 4, symbol: 'MATIC', name: 'Polygon' } },
  { id: 37, coin: { id: 4, symbol: 'USDC', name: 'USD Coin', logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' }, network: { id: 7, symbol: 'ARB', name: 'Arbitrum' } },
  { id: 38, coin: { id: 4, symbol: 'USDC', name: 'USD Coin', logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' }, network: { id: 8, symbol: 'BASE', name: 'Base' } },
  { id: 39, coin: { id: 4, symbol: 'USDC', name: 'USD Coin', logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' }, network: { id: 10, symbol: 'OP', name: 'Optimism' } },
  { id: 40, coin: { id: 4, symbol: 'USDC', name: 'USD Coin', logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' }, network: { id: 5, symbol: 'SOL', name: 'Solana' } },
  
  // BNB variants
  { id: 52, coin: { id: 5, symbol: 'BNB', name: 'BNB', logoUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' }, network: { id: 3, symbol: 'BSC', name: 'BNB Smart Chain' } },
  { id: 54, coin: { id: 5, symbol: 'BNB', name: 'BNB', logoUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' }, network: { id: 2, symbol: 'ETH', name: 'Ethereum' } },
  { id: 61, coin: { id: 5, symbol: 'BNB', name: 'BNB', logoUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' }, network: { id: 7, symbol: 'ARB', name: 'Arbitrum' } },
  
  // POL variants
  { id: 63, coin: { id: 7, symbol: 'POL', name: 'Polygon Ecosystem Token', logoUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png' }, network: { id: 2, symbol: 'ETH', name: 'Ethereum' } },
  { id: 64, coin: { id: 7, symbol: 'POL', name: 'Polygon Ecosystem Token', logoUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png' }, network: { id: 4, symbol: 'MATIC', name: 'Polygon' } },
  { id: 65, coin: { id: 7, symbol: 'POL', name: 'Polygon Ecosystem Token', logoUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png' }, network: { id: 3, symbol: 'BSC', name: 'BNB Smart Chain' } },
  
  // SOL variants
  { id: 56, coin: { id: 8, symbol: 'SOL', name: 'Solana', logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png' }, network: { id: 5, symbol: 'SOL', name: 'Solana' } },
  { id: 57, coin: { id: 8, symbol: 'SOL', name: 'Solana', logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png' }, network: { id: 3, symbol: 'BSC', name: 'BNB Smart Chain' } },
  
  // TRX variants
  { id: 58, coin: { id: 9, symbol: 'TRX', name: 'TRON', logoUrl: 'https://cryptologos.cc/logos/tron-trx-logo.png' }, network: { id: 6, symbol: 'TRX', name: 'TRON' } },
  { id: 59, coin: { id: 9, symbol: 'TRX', name: 'TRON', logoUrl: 'https://cryptologos.cc/logos/tron-trx-logo.png' }, network: { id: 3, symbol: 'BSC', name: 'BNB Smart Chain' } },
  { id: 60, coin: { id: 9, symbol: 'TRX', name: 'TRON', logoUrl: 'https://cryptologos.cc/logos/tron-trx-logo.png' }, network: { id: 2, symbol: 'ETH', name: 'Ethereum' } },
];

export const MOCK_BALANCE_DATA = {
  breakdown: [
    { coinNetworkId: 1, coinSymbol: 'BTC', networkSymbol: 'BTC', networkName: 'Bitcoin', balance: '0.5', availableBalance: '0.5' },
    { coinNetworkId: 5, coinSymbol: 'BTC', networkSymbol: 'ETH', networkName: 'Ethereum', balance: '0.1', availableBalance: '0.1' },
    
    { coinNetworkId: 6, coinSymbol: 'ETH', networkSymbol: 'ETH', networkName: 'Ethereum', balance: '2.5', availableBalance: '2.5' },
    { coinNetworkId: 11, coinSymbol: 'ETH', networkSymbol: 'MATIC', networkName: 'Polygon', balance: '1.2', availableBalance: '1.2' },
    { coinNetworkId: 8, coinSymbol: 'ETH', networkSymbol: 'ARB', networkName: 'Arbitrum', balance: '0.8', availableBalance: '0.8' },
    
    { coinNetworkId: 15, coinSymbol: 'USDT', networkSymbol: 'ETH', networkName: 'Ethereum', balance: '1000', availableBalance: '1000' },
    { coinNetworkId: 16, coinSymbol: 'USDT', networkSymbol: 'BSC', networkName: 'BNB Smart Chain', balance: '500', availableBalance: '500' },
    { coinNetworkId: 17, coinSymbol: 'USDT', networkSymbol: 'TRX', networkName: 'TRON', balance: '750', availableBalance: '750' },
    { coinNetworkId: 18, coinSymbol: 'USDT', networkSymbol: 'MATIC', networkName: 'Polygon', balance: '300', availableBalance: '300' },
    { coinNetworkId: 23, coinSymbol: 'USDT', networkSymbol: 'SOL', networkName: 'Solana', balance: '200', availableBalance: '200' },
    
    { coinNetworkId: 34, coinSymbol: 'USDC', networkSymbol: 'ETH', networkName: 'Ethereum', balance: '800', availableBalance: '800' },
    { coinNetworkId: 36, coinSymbol: 'USDC', networkSymbol: 'MATIC', networkName: 'Polygon', balance: '400', availableBalance: '400' },
    { coinNetworkId: 38, coinSymbol: 'USDC', networkSymbol: 'BASE', networkName: 'Base', balance: '250', availableBalance: '250' },
    { coinNetworkId: 40, coinSymbol: 'USDC', networkSymbol: 'SOL', networkName: 'Solana', balance: '150', availableBalance: '150' },
    
    { coinNetworkId: 52, coinSymbol: 'BNB', networkSymbol: 'BSC', networkName: 'BNB Smart Chain', balance: '5', availableBalance: '5' },
    { coinNetworkId: 54, coinSymbol: 'BNB', networkSymbol: 'ETH', networkName: 'Ethereum', balance: '2', availableBalance: '2' },
    
    { coinNetworkId: 63, coinSymbol: 'POL', networkSymbol: 'ETH', networkName: 'Ethereum', balance: '100', availableBalance: '100' },
    { coinNetworkId: 64, coinSymbol: 'POL', networkSymbol: 'MATIC', networkName: 'Polygon', balance: '250', availableBalance: '250' },
    
    { coinNetworkId: 56, coinSymbol: 'SOL', networkSymbol: 'SOL', networkName: 'Solana', balance: '10', availableBalance: '10' },
    { coinNetworkId: 57, coinSymbol: 'SOL', networkSymbol: 'BSC', networkName: 'BNB Smart Chain', balance: '5', availableBalance: '5' },
    
    { coinNetworkId: 58, coinSymbol: 'TRX', networkSymbol: 'TRX', networkName: 'TRON', balance: '5000', availableBalance: '5000' },
    { coinNetworkId: 59, coinSymbol: 'TRX', networkSymbol: 'BSC', networkName: 'BNB Smart Chain', balance: '2000', availableBalance: '2000' },
  ],
  fiat: {
    currency: 'USD',
    amount: '8750.50',
    rates: {
      BTC: '65000.00',
      ETH: '3500.00',
      USDT: '1.00',
      USDC: '1.00',
      BNB: '600.00',
      POL: '0.85',
      SOL: '150.00',
      TRX: '0.16',
    }
  }
};
