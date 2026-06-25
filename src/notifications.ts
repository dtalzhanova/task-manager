const SETTINGS_KEY = 'taskflow-telegram-settings';

interface TelegramSettings {
  botToken: string;
  managerChatId: string;
}

function loadSettings(): TelegramSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { botToken: '', managerChatId: '' };
}

export async function sendTelegram(chatId: string, message: string): Promise<boolean> {
  const { botToken } = loadSettings();
  if (!botToken || !chatId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function getTelegramSettings(): { hasToken: boolean; managerChatId: string } {
  const s = loadSettings();
  return { hasToken: !!s.botToken, managerChatId: s.managerChatId };
}

export function saveTelegramSettings(settings: { botToken?: string; managerChatId?: string }): void {
  const current = loadSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    botToken: settings.botToken !== undefined ? settings.botToken : current.botToken,
    managerChatId: settings.managerChatId !== undefined ? settings.managerChatId : current.managerChatId,
  }));
}
