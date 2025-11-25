# Istruzioni per Risolvere i Problemi di Admin e Waitlist

## Stato Attuale

### Problemi Identificati:
1. ❌ **daniele.pelleri@gmail.com** non può accedere a `/admin/waitlist`
   - **Causa**: Manca il ruolo 'admin' nel database
2. ❌ **veronica.penasso@gmail.com** non riesce a entrare dopo l'approvazione
   - **Possibili cause**: Magic link scaduto, account non creato, o problema di sincronizzazione

### Server Locale:
✅ **Server riavviato con successo su http://localhost:3000**

---

## Soluzione: Esegui gli Script SQL in Ordine

Ho creato 3 script SQL nella cartella `supabase/`:
1. `diagnostic_check.sql` - Verifica lo stato del database
2. `fix_missing_schema.sql` - Aggiunge schema mancante (tabelle, colonne, funzioni)
3. `fix_admin_and_users.sql` - Assegna admin e risolve problemi utenti

### PASSO 1: Esegui il Diagnostic Check

1. Vai a [Supabase Dashboard](https://supabase.com/dashboard/project/pttyfxgmmhuhzgwmwser)
2. Clicca su **SQL Editor** nel menu laterale
3. Apri il file `supabase/diagnostic_check.sql`
4. Copia tutto il contenuto
5. Incollalo nell'editor SQL
6. Clicca **Run** (o premi Cmd+Enter)
7. **Esamina i risultati** per capire cosa manca

### PASSO 2: Aggiungi lo Schema Mancante

1. Nell'**SQL Editor** di Supabase
2. Apri il file `supabase/fix_missing_schema.sql`
3. Copia tutto il contenuto
4. Incollalo nell'editor SQL
5. Clicca **Run**
6. Leggi i messaggi di output per verificare che tutto sia stato creato

**Cosa fa questo script:**
- ✅ Aggiunge la colonna `role` alla tabella `users` (se manca)
- ✅ Crea la tabella `waitlist_entries` con tutte le colonne necessarie
- ✅ Crea indici per performance
- ✅ Abilita Row Level Security (RLS) con le policy corrette
- ✅ Crea la funzione `generate_referral_code()`
- ✅ Crea la funzione `update_queue_positions()`
- ✅ Crea trigger per aggiornare `updated_at` automaticamente

### PASSO 3: Assegna Admin e Risolvi Problemi Utenti

1. Nell'**SQL Editor** di Supabase
2. Apri il file `supabase/fix_admin_and_users.sql`
3. Copia tutto il contenuto
4. Incollalo nell'editor SQL
5. Clicca **Run**
6. **Leggi attentamente i messaggi di output**

**Cosa fa questo script:**
- ✅ Assegna il ruolo `admin` a `daniele.pelleri@gmail.com`
- ✅ Verifica lo stato di `veronica.penasso@gmail.com`
- ✅ Crea record mancanti in `public.users` se necessario
- ✅ Aggiorna lo status della waitlist a `converted` se necessario
- ✅ Mostra un report dettagliato di tutti gli admin e waitlist entries

### PASSO 4: Verifica che Tutto Funzioni

#### Test 1: Accesso Admin di Daniele
1. Vai a http://localhost:3000
2. Fai logout se sei già loggato
3. Fai login con `daniele.pelleri@gmail.com`
4. Vai a http://localhost:3000/admin/waitlist
5. ✅ Dovresti vedere la pagina admin della waitlist

#### Test 2: Login di Veronica
1. **Scenario A**: Se lo script ha trovato l'account in `auth.users`
   - Veronica può fare login normalmente
   - Vai a http://localhost:3000/login
   - Usa l'email `veronica.penasso@gmail.com`
   - Riceverà un magic link via email

2. **Scenario B**: Se lo script dice "User NOT found in auth.users"
   - Il magic link precedente è scaduto
   - **Devi ri-approvare Veronica dalla pagina admin**:
     1. Login come admin (daniele.pelleri@gmail.com)
     2. Vai a http://localhost:3000/admin/waitlist
     3. Trova Veronica nella lista
     4. Clicca "Approve" per inviare un nuovo magic link
     5. Veronica riceverà una nuova email
     6. Deve cliccare il link entro 1 ora

---

## Cosa Succede Dopo l'Approvazione

### Flusso Normale della Waitlist:
1. **Utente si iscrive** → Status: `pending`
2. **Admin approva** → Status: `approved`, invia magic link via email
3. **Utente clicca magic link** → Crea account in `auth.users`
4. **Callback auth** → Status: `converted`, crea record in `public.users`

### Problemi Comuni:

#### Problema: "Magic link expired"
- **Causa**: I magic link scadono dopo 1 ora (default Supabase)
- **Soluzione**: Ri-approva dalla pagina admin per inviare un nuovo link

#### Problema: "User exists in auth.users but not in public.users"
- **Causa**: Race condition tra auth callback e creazione record
- **Soluzione**: Lo script `fix_admin_and_users.sql` crea automaticamente il record mancante

#### Problema: "CORS error" durante login
- **Causa**: In realtà è un errore RLS, non CORS
- **Causa**: Session non ancora stabilita quando si fa query al database
- **Risolto**: Commit `32bca23` ha risolto questa race condition

---

## Configurazione Vercel / Produzione

Se vuoi testare in produzione (non localhost):

### 1. Aggiorna NEXT_PUBLIC_APP_URL
Nel file `.env.local`:
```bash
# Per localhost (attuale)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Per produzione Vercel
NEXT_PUBLIC_APP_URL=https://tuo-dominio.vercel.app
```

### 2. Configura le stesse variabili su Vercel
1. Vai a Vercel Dashboard
2. Seleziona il progetto
3. Settings → Environment Variables
4. Aggiungi tutte le variabili da `.env.local`
5. **IMPORTANTE**: Non committare mai `.env.local` su Git!

---

## Comandi Utili

### Controllare se il server è in esecuzione:
```bash
lsof -ti:3000
```

### Fermare il server sulla porta 3000:
```bash
lsof -ti:3000 | xargs kill -9
```

### Riavviare il server:
```bash
npm run dev
```

### Vedere i log del server in tempo reale:
Il server è già in esecuzione in background. Vai a http://localhost:3000 per testare.

---

## Debug Avanzato

### Verificare lo stato del database manualmente:

```sql
-- Controlla admin
SELECT id, email, role FROM public.users WHERE email = 'daniele.pelleri@gmail.com';

-- Controlla veronica
SELECT email, status, converted_user_id
FROM public.waitlist_entries
WHERE email LIKE '%veronica%';

-- Controlla auth.users
SELECT id, email, confirmed_at, last_sign_in_at
FROM auth.users
WHERE email LIKE '%veronica%';
```

### Vedere i log di Supabase Auth:
1. Vai a Supabase Dashboard
2. Authentication → Logs
3. Cerca errori relativi al magic link o email

### Vedere i log delle email (Resend):
1. Vai a [Resend Dashboard](https://resend.com/emails)
2. Cerca email inviate a `veronica.penasso@gmail.com`
3. Verifica se sono state consegnate o se ci sono errori

---

## Prossimi Passi

1. ✅ **Esegui i 3 script SQL nell'ordine indicato**
2. ✅ **Testa l'accesso admin di daniele.pelleri@gmail.com**
3. ✅ **Verifica lo stato di veronica.penasso@gmail.com**
4. ✅ **Se necessario, ri-approva Veronica dalla pagina admin**
5. ✅ **Crea una migration file** per questi cambiamenti (opzionale ma consigliato)

---

## Note Importanti

- 🔐 **Sicurezza**: I magic link scadono dopo 1 ora per sicurezza
- 📧 **Email**: Assicurati che le email di Resend non vadano in spam
- 🔄 **RLS**: Le Row Level Security policies proteggono i dati sensibili
- 🚀 **Produzione**: Ricorda di aggiornare `NEXT_PUBLIC_APP_URL` in produzione

---

## Supporto

Se riscontri ancora problemi dopo aver seguito queste istruzioni:

1. **Controlla i log di Supabase**: Dashboard → Logs
2. **Controlla i log di Resend**: Dashboard → Emails
3. **Esegui di nuovo `diagnostic_check.sql`** per vedere lo stato attuale
4. **Controlla la console del browser**: Apri DevTools (F12) e guarda gli errori

---

**Creato**: 2025-11-24
**Server Locale**: ✅ In esecuzione su http://localhost:3000
**Database**: ⏳ In attesa di esecuzione degli script SQL
