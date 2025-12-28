// LINE Messaging API Configuration
export const LINE_CONFIG = {
  channelId: process.env.LINE_CHANNEL_ID || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
};

// LINE API Endpoints
export const LINE_API = {
  REPLY: 'https://api.line.me/v2/bot/message/reply',
  PUSH: 'https://api.line.me/v2/bot/message/push',
  PROFILE: 'https://api.line.me/v2/bot/profile',
};

// Validate LINE configuration
export const validateLINEConfig = (): boolean => {
  return !!(
    LINE_CONFIG.channelId &&
    LINE_CONFIG.channelSecret &&
    LINE_CONFIG.channelAccessToken
  );
};
