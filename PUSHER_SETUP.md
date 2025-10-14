# Pusher Real-time Integration

This document explains how to set up and use Pusher for real-time invoice updates.

## Features

- **Real-time payment notifications** - Get instant updates when payments are received
- **Auto-refresh invoice data** - Invoice pages automatically refresh when data changes
- **Sound notifications** - Pleasant sound alerts for payment events
- **Browser notifications** - Desktop notifications for important events (requires permission)

## Setup

### 1. Install Dependencies

Already installed via `npm install pusher-js`

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Pusher configuration
VITE_PUSHER_APP_KEY=your-pusher-app-key
VITE_PUSHER_CLUSTER=ap1

# Optional: For self-hosted Pusher/Soketi
# VITE_PUSHER_WS_HOST=localhost
# VITE_PUSHER_WS_PORT=6001
# VITE_PUSHER_FORCE_TLS=false
```

### 3. Pusher/Soketi Options

#### Option A: Use Pusher Cloud (Recommended for production)
1. Sign up at https://pusher.com
2. Create a new app
3. Copy your app key and cluster
4. Set `VITE_PUSHER_APP_KEY` and `VITE_PUSHER_CLUSTER`

#### Option B: Use Soketi (Self-hosted, free)
1. Install Soketi: https://docs.soketi.app/
2. Run Soketi locally or on your server
3. Configure environment variables:
   ```env
   VITE_PUSHER_APP_KEY=app-key
   VITE_PUSHER_CLUSTER=ap1
   VITE_PUSHER_WS_HOST=localhost
   VITE_PUSHER_WS_PORT=6001
   VITE_PUSHER_FORCE_TLS=false
   ```

## Backend Integration

Your backend needs to send Pusher events when invoice data changes.

### Channel Names

- **Invoice-specific**: `invoice.{invoiceId}`
- **User-specific**: `user.{userId}.invoices`

### Event Names

#### Invoice-specific events (channel: `invoice.{invoiceId}`)
- `payment.received` - Triggered when a payment is received
- `invoice.status.changed` - Triggered when invoice status changes
- `invoice.updated` - Triggered when invoice data is updated

#### User-specific events (channel: `user.{userId}.invoices`)
- `invoice.created` - Triggered when a new invoice is created
- `invoice.updated` - Triggered when any invoice is updated
- `payment.received` - Triggered when payment is received on any invoice

### Event Data Format

The backend sends events with the following structure:

```json
{
  "title": "✅ Invoice Paid",
  "body": "Invoice #7 has been paid successfully",
  "type": "invoice_completed",
  "invoiceId": "7",
  "sentAt": "2025-10-12T18:40:12.153Z"
}
```

**Fields:**
- `title` - Notification title (e.g., "✅ Invoice Paid")
- `body` - Notification message
- `type` - Event type (`invoice_completed`, `invoice_created`, etc.)
- `invoiceId` - ID of the invoice
- `sentAt` - Timestamp when event was sent
- `status` (optional) - Invoice status if changed

### Example Backend Code (Node.js)

```javascript
const Pusher = require('pusher');

const pusher = new Pusher({
  appId: 'your-app-id',
  key: 'your-app-key',
  secret: 'your-app-secret',
  cluster: 'ap1',
  useTLS: true
});

// When payment is received
async function notifyPaymentReceived(invoice) {
  const eventData = {
    title: '✅ Invoice Paid',
    body: `Invoice #${invoice.invoiceNumber || invoice.id} has been paid successfully`,
    type: 'invoice_completed',
    invoiceId: String(invoice.id),
    status: 'paid',
    sentAt: new Date().toISOString()
  };

  // Notify invoice-specific channel
  await pusher.trigger(`invoice.${invoice.id}`, 'invoice.status.changed', eventData);

  // Notify user channel
  await pusher.trigger(`user.${invoice.userId}.invoices`, 'payment.received', eventData);
}

// When invoice status changes
async function notifyStatusChanged(invoice, newStatus) {
  const eventData = {
    title: `Invoice Status: ${newStatus}`,
    body: `Invoice #${invoice.invoiceNumber || invoice.id} status changed to ${newStatus}`,
    type: `invoice_${newStatus}`,
    invoiceId: String(invoice.id),
    status: newStatus,
    sentAt: new Date().toISOString()
  };

  await pusher.trigger(`invoice.${invoice.id}`, 'invoice.status.changed', eventData);
}

// When invoice is updated
async function notifyInvoiceUpdated(invoice) {
  const eventData = {
    title: 'Invoice Updated',
    body: `Invoice #${invoice.invoiceNumber || invoice.id} has been updated`,
    type: 'invoice_updated',
    invoiceId: String(invoice.id),
    sentAt: new Date().toISOString()
  };

  await pusher.trigger(`invoice.${invoice.id}`, 'invoice.updated', eventData);
  await pusher.trigger(`user.${invoice.userId}.invoices`, 'invoice.updated', eventData);
}
```

## Frontend Usage

The integration is already set up in the following pages:

### InvoicePayment (`/pay/:id`)
- Subscribes to invoice-specific events
- Auto-refreshes when payment is received
- Plays success sound on payment

### InvoiceDetail (`/app/invoices/:id`)
- Subscribes to invoice-specific events
- Shows browser notification on payment
- Auto-refreshes invoice data

### InvoiceList (`/app/invoices`)
- Subscribes to user-specific events
- Updates list when invoices change
- Shows notifications for new payments

## Customization

### Disable Sound Notifications

Edit the component and remove `playNotificationSound()` calls.

### Disable Browser Notifications

Edit the component and remove `notifyPaymentReceived()` and `notifyInvoiceUpdated()` calls.

### Change Sound Type

Available sound types in `playNotificationSound(type)`:
- `'success'` - Pleasant ascending tone (default for payments)
- `'info'` - Single tone
- `'warning'` - Two tones
- `'error'` - Descending tone

## Troubleshooting

### Pusher not connecting
1. Check that `VITE_PUSHER_APP_KEY` is set correctly
2. Check browser console for connection errors
3. Verify your Pusher app is active

### Events not received
1. Verify backend is sending events to correct channels
2. Check that invoice IDs match between frontend and backend
3. Check browser console for subscription logs

### No sound notifications
1. Check browser audio permissions
2. Ensure user has interacted with the page (browsers block auto-play audio)

## Testing

You can test Pusher events using the Pusher Debug Console:
1. Go to your Pusher dashboard
2. Select your app
3. Go to "Debug Console"
4. Manually trigger events to test

Or use the Pusher Event Creator:
```bash
curl -X POST "https://api-{cluster}.pusher.com/apps/{app_id}/events" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "payment.received",
    "channel": "invoice.123",
    "data": "{\"invoiceId\":123,\"status\":\"paid\"}"
  }'
```
