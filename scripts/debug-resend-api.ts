/**
 * Debug Script - Resend API Connection Test
 * Verifica che la connessione con Resend funzioni correttamente
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Carica variabili d'ambiente da .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { Resend } from 'resend';

// Colori per console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color: string, message: string) {
  console.log(`${color}${message}${colors.reset}`);
}

async function debugResendAPI() {
  log(colors.bright + colors.cyan, '\n🔍 DEBUG RESEND API CONNECTION\n');

  // 1. Verifica API Key
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log(colors.red, '❌ RESEND_API_KEY non trovata in .env.local');
    process.exit(1);
  }

  log(colors.blue, `✓ RESEND_API_KEY trovata: ${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`);
  log(colors.blue, `  Lunghezza: ${apiKey.length} caratteri\n`);

  // 2. Verifica altre variabili
  const emailFromDomain = process.env.EMAIL_FROM_DOMAIN || 'arvo.guru';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  log(colors.blue, `✓ EMAIL_FROM_DOMAIN: ${emailFromDomain}`);
  log(colors.blue, `✓ APP_URL: ${appUrl}\n`);

  // 3. Inizializza Resend
  log(colors.yellow, '▶ Inizializzazione Resend client...');
  const resend = new Resend(apiKey);
  log(colors.green, '✓ Resend client inizializzato\n');

  // 4. Prova a inviare un'email di test SEMPLICE
  log(colors.yellow, '▶ Invio email di test...');
  const fromEmail = `ARVO <onboarding@${emailFromDomain}>`;
  const toEmail = 'daniele.pelleri@gmail.com';

  try {
    log(colors.blue, `  FROM: ${fromEmail}`);
    log(colors.blue, `  TO: ${toEmail}`);
    log(colors.blue, `  SUBJECT: Test Email Debug\n`);

    const result = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: 'Test Email Debug - ARVO',
      html: '<h1>Test Email</h1><p>Questa è una email di test per verificare la connessione con Resend API.</p>',
    });

    log(colors.green, '✓ API call completata!\n');
    log(colors.bright + colors.cyan, '📦 RISPOSTA RESEND:');
    console.log(JSON.stringify(result, null, 2));

    if (result.data) {
      log(colors.bright + colors.green, '\n✅ EMAIL INVIATA CON SUCCESSO!');
      log(colors.green, `   Email ID: ${result.data.id}`);
      log(colors.blue, '\n📬 Controlla la inbox di daniele.pelleri@gmail.com');
      log(colors.blue, '📊 Controlla anche il dashboard Resend: https://resend.com/emails\n');
    } else if (result.error) {
      log(colors.bright + colors.red, '\n❌ ERRORE DALLA API:');
      console.log(JSON.stringify(result.error, null, 2));
    }

  } catch (error: any) {
    log(colors.bright + colors.red, '\n❌ ECCEZIONE DURANTE L\'INVIO:');
    console.error(error);

    if (error.response) {
      log(colors.red, '\nRisposta HTTP:');
      console.log(JSON.stringify(error.response, null, 2));
    }

    if (error.message) {
      log(colors.red, `\nMessaggio errore: ${error.message}`);
    }

    process.exit(1);
  }
}

// Esegui debug
debugResendAPI()
  .then(() => {
    log(colors.bright + colors.green, '\n✅ DEBUG COMPLETATO\n');
    process.exit(0);
  })
  .catch((error) => {
    log(colors.bright + colors.red, `\n❌ ERRORE FATALE: ${error.message}\n`);
    console.error(error);
    process.exit(1);
  });
