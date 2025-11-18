# Development Notes

## Scheduled Tasks / Cron Jobs

### Study Reminders
For study reminders to work automatically, set up a cron job or scheduled task to call `processDueReminders()` from `backend/src/services/studyReminderService.ts` periodically (e.g., every minute). This can be added to your server startup or as a separate worker process.

**Location:** `backend/src/services/studyReminderService.ts`
**Function:** `processDueReminders()`
**Recommended frequency:** Every 1 minute

### Live Session Reminders
For automatic session reminders, set up a cron job or scheduled task to call `sendSessionReminders()` from `backend/src/services/liveSessionService.ts` periodically (e.g., every 15 minutes). This can be added to your server startup or as a separate worker process.

**Location:** `backend/src/services/liveSessionService.ts`
**Function:** `sendSessionReminders()`
**Recommended frequency:** Every 15 minutes

### Implementation Example
You can use a package like `node-cron` or `node-schedule` to set up these scheduled tasks. Add them to your server startup file (`backend/src/server.ts`) or create a separate worker process.

```typescript
import cron from 'node-cron';
import { processDueReminders } from './services/studyReminderService';
import { sendSessionReminders } from './services/liveSessionService';

// Run every minute
cron.schedule('* * * * *', () => {
  processDueReminders().catch(console.error);
});

// Run every 15 minutes
cron.schedule('*/15 * * * *', () => {
  sendSessionReminders().catch(console.error);
});
```

## PWA Setup

### VAPID Keys for Push Notifications
To enable push notifications, you need to generate VAPID keys:

1. Install web-push globally:
   ```bash
   npm install -g web-push
   ```

2. Generate VAPID keys:
   ```bash
   web-push generate-vapid-keys
   ```

3. Add to your `.env` file:
   ```env
  
   ```

4. Install web-push package:
   ```bash
   cd backend
   npm install web-push
   npm install --save-dev @types/web-push
   ```

**Note:** The `web-push` package needs to be added to `package.json` dependencies.

## Scheduled Account Deletions

For scheduled account deletions to work automatically, set up a cron job or scheduled task to call `processScheduledDeletions()` from `backend/src/services/dataPrivacyService.ts` periodically (e.g., daily).

**Location:** `backend/src/services/dataPrivacyService.ts`
**Function:** `processScheduledDeletions()`
**Recommended frequency:** Daily (once per day)

### Implementation Example
```typescript
import cron from 'node-cron';
import { processScheduledDeletions } from './services/dataPrivacyService';

// Run daily at 2 AM
cron.schedule('0 2 * * *', () => {
  processScheduledDeletions().catch(console.error);
});
```

