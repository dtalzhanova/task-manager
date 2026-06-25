import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const SETTINGS_KEY = 'whatsapp-settings';
let settings = {
  apiToken: '',
  phoneNumberId: '',
  managerPhone: '',
};

app.get('/api/whatsapp/settings', (_req, res) => {
  res.json({ phoneNumberId: settings.phoneNumberId ? '***настроен***' : '', managerPhone: settings.managerPhone, hasToken: !!settings.apiToken });
});

app.post('/api/whatsapp/settings', (req, res) => {
  const { apiToken, phoneNumberId, managerPhone } = req.body;
  if (apiToken !== undefined) settings.apiToken = apiToken;
  if (phoneNumberId !== undefined) settings.phoneNumberId = phoneNumberId;
  if (managerPhone !== undefined) settings.managerPhone = managerPhone;
  res.json({ ok: true });
});

app.post('/api/whatsapp/send', async (req, res) => {
  const { phone, message } = req.body;

  if (!settings.apiToken || !settings.phoneNumberId) {
    return res.status(400).json({ error: 'WhatsApp API не настроен. Укажите токен и Phone Number ID в настройках.' });
  }

  if (!phone) {
    return res.status(400).json({ error: 'Не указан номер телефона' });
  }

  const cleanPhone = phone.replace(/[^\d]/g, '');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${settings.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.apiToken}`,
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

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Ошибка отправки', details: data });
    }

    console.log(`WhatsApp sent to ${cleanPhone}: "${message.substring(0, 50)}..."`);
    res.json({ ok: true, messageId: data.messages?.[0]?.id });
  } catch (err) {
    console.error('WhatsApp send error:', err);
    res.status(500).json({ error: 'Ошибка подключения к WhatsApp API' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Notification server running on http://localhost:${PORT}`);
});
