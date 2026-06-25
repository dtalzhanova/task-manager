const SETTINGS_KEY = 'taskflow-whatsapp-settings';

interface WhatsAppSettings {
  apiToken: string;
  phoneNumberId: string;
  managerPhone: string;
}

function loadSettings(): WhatsAppSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { apiToken: '', phoneNumberId: '', managerPhone: '' };
}

function saveSettings(settings: WhatsAppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  const { apiToken, phoneNumberId } = loadSettings();
  if (!apiToken || !phoneNumberId || !phone) return false;

  const cleanPhone = phone.replace(/[^\d]/g, '');

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: message },
        }),
      }
    );
    return res.ok;
  } catch {
    console.warn('WhatsApp send failed');
    return false;
  }
}

export function getWhatsAppSettings(): { hasToken: boolean; phoneNumberId: string; managerPhone: string } {
  const s = loadSettings();
  return { hasToken: !!s.apiToken, phoneNumberId: s.phoneNumberId ? '***' : '', managerPhone: s.managerPhone };
}

export function saveWhatsAppSettings(settings: { apiToken?: string; phoneNumberId?: string; managerPhone?: string }): boolean {
  const current = loadSettings();
  const updated: WhatsAppSettings = {
    apiToken: settings.apiToken !== undefined ? settings.apiToken : current.apiToken,
    phoneNumberId: settings.phoneNumberId !== undefined ? settings.phoneNumberId : current.phoneNumberId,
    managerPhone: settings.managerPhone !== undefined ? settings.managerPhone : current.managerPhone,
  };
  saveSettings(updated);
  return true;
}
