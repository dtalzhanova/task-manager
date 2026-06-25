const API_BASE = 'http://localhost:3001';

export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    });
    if (!res.ok) {
      const data = await res.json();
      console.warn('WhatsApp notification failed:', data.error);
      return false;
    }
    return true;
  } catch {
    console.warn('Notification server unavailable');
    return false;
  }
}

export async function getWhatsAppSettings(): Promise<{ hasToken: boolean; phoneNumberId: string; managerPhone: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/whatsapp/settings`);
    return await res.json();
  } catch {
    return { hasToken: false, phoneNumberId: '', managerPhone: '' };
  }
}

export async function saveWhatsAppSettings(settings: { apiToken?: string; phoneNumberId?: string; managerPhone?: string }): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/whatsapp/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.ok;
  } catch {
    return false;
  }
}
