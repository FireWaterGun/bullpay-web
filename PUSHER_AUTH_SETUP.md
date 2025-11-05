# Pusher Private Channel Authentication Setup

## Overview
This application uses Pusher **private channels** for secure real-time communications. Private channels require server-side authentication to ensure only authorized users can subscribe.

## Why Private Channels?

**Security Issues with Public Channels:**
- ❌ Anyone can subscribe to `user.123.invoices` and see user data
- ❌ No authentication or authorization
- ❌ Data leakage risk

**Benefits of Private Channels:**
- ✅ Server validates each subscription attempt
- ✅ Only authenticated users can subscribe to their own channels
- ✅ Prevents unauthorized access to sensitive data

## Channel Naming Convention

```javascript
// ❌ OLD (Public - Insecure)
user.123.invoices
invoice.abc-123

// ✅ NEW (Private - Secure)
private-user.123.invoices
private-invoice.abc-123
```

## Backend Implementation Required

### 1. Create Auth Endpoint

Create an endpoint at `/api/pusher/auth` that:
1. Validates user authentication (JWT, session, etc.)
2. Authorizes channel access
3. Returns Pusher auth signature

#### Example (Node.js/Express):

```javascript
const express = require('express');
const Pusher = require('pusher');
const router = express.Router();

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
});

// Authentication middleware (replace with your auth logic)
const authenticateUser = (req, res, next) => {
  // Example: Check JWT token, session, etc.
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Verify token and attach user to request
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  req.user = user;
  next();
};

// Pusher auth endpoint
router.post('/api/pusher/auth', authenticateUser, (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;
  const userId = req.user.id;

  // Authorization logic
  if (channel.startsWith('private-user.')) {
    // Extract userId from channel name
    const channelUserId = channel.match(/private-user\.(\d+)\./)?.[1];
    
    // Only allow users to subscribe to their own channels
    if (channelUserId !== userId.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } else if (channel.startsWith('private-invoice.')) {
    // Extract invoiceId from channel name
    const invoiceId = channel.replace('private-invoice.', '');
    
    // Check if user owns or has access to this invoice
    const hasAccess = await checkInvoiceAccess(userId, invoiceId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } else {
    return res.status(403).json({ error: 'Invalid channel' });
  }

  // Generate auth signature
  const auth = pusher.authorizeChannel(socketId, channel);
  res.json(auth);
});

module.exports = router;
```

#### Example (Laravel):

```php
// routes/api.php
Route::post('/pusher/auth', [PusherController::class, 'auth'])
    ->middleware('auth:sanctum');

// app/Http/Controllers/PusherController.php
class PusherController extends Controller
{
    public function auth(Request $request)
    {
        $socketId = $request->input('socket_id');
        $channelName = $request->input('channel_name');
        $userId = auth()->id();

        // Authorization logic
        if (str_starts_with($channelName, 'private-user.')) {
            $channelUserId = (int) explode('.', $channelName)[1];
            
            if ($channelUserId !== $userId) {
                return response()->json(['error' => 'Forbidden'], 403);
            }
        } elseif (str_starts_with($channelName, 'private-invoice.')) {
            $invoiceId = str_replace('private-invoice.', '', $channelName);
            
            if (!$this->checkInvoiceAccess($userId, $invoiceId)) {
                return response()->json(['error' => 'Forbidden'], 403);
            }
        } else {
            return response()->json(['error' => 'Invalid channel'], 403);
        }

        // Generate auth signature
        $pusher = new Pusher\Pusher(
            config('broadcasting.connections.pusher.key'),
            config('broadcasting.connections.pusher.secret'),
            config('broadcasting.connections.pusher.app_id'),
            config('broadcasting.connections.pusher.options')
        );

        return $pusher->socket_auth($channelName, $socketId);
    }
}
```

### 2. Update Frontend Auth Headers

Add authentication token to Pusher config:

```javascript
// src/context/PusherContext.jsx
const token = getAuthToken(); // Get from your auth context

const pusherConfig = {
  // ... other config
  auth: {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
};
```

### 3. Environment Variables

Add to `.env`:

```env
# Frontend (.env)
VITE_PUSHER_AUTH_ENDPOINT=/api/pusher/auth

# Backend (.env)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=ap1
```

## Testing

### 1. Test Authentication
```bash
curl -X POST http://localhost:3000/api/pusher/auth \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "socket_id": "123.456",
    "channel_name": "private-user.5.invoices"
  }'
```

Should return:
```json
{
  "auth": "your_app_key:signature"
}
```

### 2. Test Subscription
Open browser console and watch for:
```
[PusherContext] ✅ Pusher connected successfully!
✅ Subscribed to private-user.5.invoices
```

### 3. Test Broadcasting (Backend)
```javascript
// Node.js
pusher.trigger('private-user.5.invoices', 'invoice.created', {
  id: 'inv-123',
  amount: 100
});
```

```php
// Laravel
broadcast(new InvoiceCreated($invoice))->toOthers();
```

## Migration from Public to Private Channels

If migrating from public channels:

1. ✅ Update frontend code (already done)
2. ⚠️ Implement backend auth endpoint (required)
3. ⚠️ Update backend broadcasting to use `private-` prefix
4. ✅ Test thoroughly before deploying

## Troubleshooting

**401 Unauthorized:**
- Check auth token is valid
- Verify Authorization header is sent

**403 Forbidden:**
- Check authorization logic
- Ensure user has access to the channel

**Subscription Failed:**
- Check auth endpoint URL is correct
- Verify CORS settings
- Check network tab for auth requests

## Security Best Practices

1. ✅ Always use private channels for user-specific data
2. ✅ Validate user identity server-side
3. ✅ Check channel access permissions
4. ✅ Use HTTPS/WSS in production
5. ✅ Rotate Pusher secrets regularly
6. ✅ Never expose Pusher secret on frontend

## References

- [Pusher Private Channels Documentation](https://pusher.com/docs/channels/using_channels/private-channels/)
- [Pusher Authentication Documentation](https://pusher.com/docs/channels/server_api/authenticating-users/)
