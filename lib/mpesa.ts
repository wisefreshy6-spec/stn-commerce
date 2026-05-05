import axios from "axios";

const baseURL = process.env.MPESA_BASE_URL!;

export async function getMpesaToken() {
  const key = process.env.MPESA_CONSUMER_KEY!;
  const secret = process.env.MPESA_CONSUMER_SECRET!;

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await axios.get(
    `${baseURL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  return res.data.access_token;
}

export function generateTimestamp() {
  const date = new Date();

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

export function generatePassword() {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const timestamp = generateTimestamp();

  const raw = shortcode + passkey + timestamp;
  const password = Buffer.from(raw).toString("base64");

  return { password, timestamp };
}