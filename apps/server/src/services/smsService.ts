/**
 * SMS Gateway Dispatcher
 * Supports Fast2SMS (India), Twilio (Global), or terminal fallback if keys are pending.
 */

export interface SendSmsResult {
  success: boolean;
  provider: "fast2sms" | "twilio" | "console";
  message?: string;
}

export async function sendSmsOtp(phoneNumber: string, otp: string): Promise<SendSmsResult> {
  const cleanNumber = phoneNumber.replace(/\D/g, "");

  // 1. Check for Fast2SMS (popular for Indian numbers)
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  if (fast2SmsKey) {
    try {
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: fast2SmsKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variables_values: otp,
          route: "otp",
          numbers: cleanNumber.slice(-10), // 10 digit Indian number
        }),
      });
      const data: any = await response.json();
      if (data && data.return) {
        console.log(`[SMS Gateway] Sent OTP via Fast2SMS to ${phoneNumber}`);
        return { success: true, provider: "fast2sms" };
      } else {
        console.error("[SMS Gateway] Fast2SMS error:", data);
      }
    } catch (err) {
      console.error("[SMS Gateway] Failed calling Fast2SMS:", err);
    }
  }

  // 2. Check for Twilio (Global standard)
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const body = new URLSearchParams({
        To: phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`,
        From: twilioFrom,
        Body: `Your Intervue verification code is: ${otp}. Valid for 5 minutes. Do not share this with anyone.`,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        }
      );

      if (response.ok) {
        console.log(`[SMS Gateway] Sent OTP via Twilio to ${phoneNumber}`);
        return { success: true, provider: "twilio" };
      } else {
        const errorText = await response.text();
        console.error("[SMS Gateway] Twilio error:", errorText);
      }
    } catch (err) {
      console.error("[SMS Gateway] Failed calling Twilio:", err);
    }
  }

  // 3. Fallback: Log to Server Console if SMS Gateway credentials are not yet added in .env
  console.log(`\n======================================================`);
  console.log(`📱 [SMS GATEWAY DISPATCHER] Real OTP generated!`);
  console.log(`Recipient: ${phoneNumber}`);
  console.log(`Verification OTP: >>> ${otp} <<<`);
  console.log(`Expiry: 5 minutes`);
  console.log(`(To deliver this directly to the physical handset via telecom carrier, add TWILIO_* or FAST2SMS_API_KEY in apps/server/.env)`);
  console.log(`======================================================\n`);

  return {
    success: true,
    provider: "console",
    message: "OTP generated. (SMS Gateway credentials required in .env for physical carrier delivery)",
  };
}
