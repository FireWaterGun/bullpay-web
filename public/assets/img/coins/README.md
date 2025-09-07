# Coin Logo Directory

This directory contains SVG logo files for cryptocurrency coins displayed in the BullPay admin dashboard.

## File Naming Convention

Logo files should be named using the coin's symbol in lowercase, with any special characters removed:

- Bitcoin (BTC) → `btc.svg` or `bitcoin.svg`
- Ethereum (ETH) → `eth.svg` or `ethereum.svg`
- 1inch → `1inch.svg`
- Binance Coin (BNB) → `bnb.svg`

## Supported Formats

- **SVG** (recommended): Vector format that scales well at any size
- **PNG**: Raster format with transparent background (24x24px minimum)

## Usage in Components

The `CoinLogo` component will automatically:

1. Try to load the coin's `logo_url` if provided by the API
2. Fall back to `/images/coins/{symbol}.svg` based on the coin symbol
3. Display a colored circle with the coin symbol if no image is found

## Adding New Logos

1. Save the logo file in this directory using the naming convention above
2. Ensure the file is optimized for web use (small file size)
3. For SVG files, use a viewBox of "0 0 32 32" for consistency

## API Integration

When the API provides a `logo_url` field, it will be used directly. Supported API field names:

- `logo_url`
- `logoUrl`
- `icon`
- `image`

Example API response:

```json
{
  "id": "bitcoin",
  "symbol": "BTC",
  "name": "Bitcoin",
  "logo_url": "/images/coins/bitcoin.svg",
  "enabled": true
}
```
