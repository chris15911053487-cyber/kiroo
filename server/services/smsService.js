const pool = require('../db');

/**
 * Send SMS verification code via Tencent Cloud SMS.
 * Phase 1: returns the code (no actual SMS sent).
 * Phase 2: set SMS_ENABLED=true and configure credentials to send real SMS.
 */
async function send(phone, code) {
  if (process.env.SMS_ENABLED !== 'true') {
    console.log(`[SMS Dev] Code for ${phone}: ${code}`);
    return;
  }

  try {
    const tencentcloud = require('tencentcloud-sdk-nodejs-sms');
    const SmsClient = tencentcloud.sms.v20210111.Client;

    const client = new SmsClient({
      credential: {
        secretId: process.env.SMS_SECRET_ID,
        secretKey: process.env.SMS_SECRET_KEY,
      },
      region: 'ap-beijing',
    });

    await client.SendSms({
      SmsSdkAppId: process.env.SMS_SDK_APP_ID,
      SignName: process.env.SMS_SIGN_NAME,
      TemplateId: process.env.SMS_TEMPLATE_ID,
      PhoneNumberSet: [`+86${phone}`],
      TemplateParamSet: [code, '5'],
    });

    console.log(`[SMS] Sent code to ${phone}`);
  } catch (err) {
    console.error('[SMS] Failed to send:', err.message);
    throw err;
  }
}

/**
 * Verify SMS code for given phone number.
 * Returns true if the code is valid and not expired, false otherwise.
 */
async function verify(phone, code) {
  const [rows] = await pool.query(
    'SELECT id FROM sms_codes WHERE phone = ? AND code = ? AND expires_at > NOW() AND used = 0 ORDER BY id DESC LIMIT 1',
    [phone, code]
  );

  if (rows.length === 0) {
    // Phase 1 dev bypass
    if (process.env.SMS_ENABLED !== 'true' && code === '123456') {
      return true;
    }
    return false;
  }

  // Mark as used
  await pool.query('UPDATE sms_codes SET used = 1 WHERE id = ?', [rows[0].id]);
  return true;
}

module.exports = { send, verify };
