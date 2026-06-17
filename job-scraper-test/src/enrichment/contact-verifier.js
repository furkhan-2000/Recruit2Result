/**
 * Contact Verification Engine
 * Implements high-accuracy verification for Emails and Phones.
 */
import dns from "dns";
import { promisify } from "util";
import net from "net";

const resolveMx = promisify(dns.resolveMx);

/**
 * SMTP Handshake: Verifies if a mailbox exists without sending an email.
 * 0% error target for production.
 */
export async function verifyEmail(email) {
  if (!email || !email.includes("@")) return { valid: false, reason: "invalid_format" };

  const domain = email.split("@")[1];
  
  try {
    // 1. Check MX records
    const addresses = await resolveMx(domain);
    if (!addresses || addresses.length === 0) return { valid: false, reason: "no_mx_records" };
    
    // Sort by priority
    addresses.sort((a, b) => a.priority - b.priority);
    const mxHost = addresses[0].exchange;

    // 2. SMTP Handshake
    return new Promise((resolve) => {
      const socket = net.createConnection(25, mxHost);
      let step = 0;

      socket.setEncoding("ascii");
      socket.setTimeout(10000);

      socket.on("data", (data) => {
        if (data.indexOf("220") === 0 && step === 0) {
          socket.write("HELO recruit2result.com\r\n");
          step++;
        } else if (data.indexOf("250") === 0 && step === 1) {
          socket.write("MAIL FROM:<verify@recruit2result.com>\r\n");
          step++;
        } else if (data.indexOf("250") === 0 && step === 2) {
          socket.write(`RCPT TO:<${email}>\r\n`);
          step++;
        } else if (step === 3) {
          if (data.indexOf("250") === 0) {
            resolve({ valid: true, email });
          } else {
            resolve({ valid: false, reason: "mailbox_rejected", response: data });
          }
          socket.write("QUIT\r\n");
          socket.end();
        }
      });

      socket.on("error", (err) => {
        resolve({ valid: false, reason: "connection_error", error: err.message });
      });

      socket.on("timeout", () => {
        socket.destroy();
        resolve({ valid: false, reason: "timeout" });
      });
    });
  } catch (err) {
    return { valid: false, reason: "dns_error", error: err.message };
  }
}

/**
 * HLR Lookup Placeholder (Requires 3rd party API key in production)
 * This verifies if a SIM is active and live.
 */
export async function verifyPhone(phone) {
  // Production implementation would use an API like Twilio or Nexmo HLR.
  // For now, we use regex validation + active check simulation.
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const isValid = /^\+?[1-9]\d{1,14}$/.test(cleanPhone);
  
  return {
    valid: isValid,
    phone: cleanPhone,
    status: isValid ? "sim_active_simulated" : "invalid_format"
  };
}
