/**
 * Email templates for ARVO onboarding and engagement campaigns
 * All templates use Italian language and inline CSS for email client compatibility
 */

interface WelcomeEmailData {
  firstName: string;
  email: string;
}

interface OnboardingCompleteEmailData {
  firstName: string;
  approachName: string;
  splitType: string;
  weeklyFrequency: number;
  weakPoints: string[];
  firstWorkoutId: string;
}

interface FirstWorkoutReminderEmailData {
  firstName: string;
  workoutName: string;
  workoutType: string;
  targetMuscles: string[];
  estimatedDuration: number;
  workoutId: string;
}

interface FirstWorkoutCompleteEmailData {
  firstName: string;
  totalVolume: number;
  duration: number;
  totalSets: number;
  exercisesCompleted: number;
}

interface WeeklyProgressEmailData {
  firstName: string;
  weekNumber: number;
  workoutsCompleted: number;
  totalVolume: number;
  muscleGroupsTrained: string[];
  currentCycleDay: number;
  cycleTotalDays: number;
}

interface CycleCompleteEmailData {
  firstName: string;
  cycleNumber: number;
  totalVolume: number;
  workoutsCompleted: number;
  totalDuration: number;
  avgMentalReadiness: number;
  volumeByMuscleGroup: Record<string, number>;
}

interface ReengagementEmailData {
  firstName: string;
  lastWorkoutType: string;
  daysSinceLastWorkout: number;
  currentCycleDay: number;
  nextWorkoutName: string;
}

interface SettingsUpdateEmailData {
  firstName: string;
  settingChanged: string;
  oldValue: string;
  newValue: string;
  impact: string;
}

export const emailTemplates = {
  /**
   * Email 1: Welcome & Onboarding Start
   * Triggered when user first creates account
   */
  welcome(data: WelcomeEmailData, appUrl: string): { subject: string; html: string } {
    return {
      subject: '🎉 Benvenuto in ARVO - Il Tuo AI Personal Trainer',
      html: `
        <h2>Benvenuto in ARVO, ${data.firstName}!</h2>

        <p>Sei pronto a trasformare il tuo allenamento con l'intelligenza artificiale?</p>

        <p>ARVO è il tuo personal trainer AI che crea piani di allenamento personalizzati basati sui metodi scientifici più avanzati come il <strong>Kuba Method</strong> e <strong>FST-7</strong>.</p>

        <h3>🚀 Iniziamo il Setup</h3>
        <p>Completa il tuo profilo di allenamento in 7 semplici step (~5 minuti):</p>

        <ul>
          <li><strong>Metodologia</strong> - Scegli il tuo approccio (Kuba, FST-7, ecc.)</li>
          <li><strong>Split & Frequenza</strong> - Quanto ti alleni a settimana?</li>
          <li><strong>Profilo</strong> - Età, peso, altezza</li>
          <li><strong>Weak Points</strong> - Quali muscoli vuoi prioritizzare?</li>
          <li><strong>Attrezzatura</strong> - Cosa hai a disposizione?</li>
          <li><strong>Livello di Forza</strong> - Quanto sollevi sui principali?</li>
          <li><strong>Review</strong> - Conferma e genera il tuo piano!</li>
        </ul>

        <br>
        <a href="${appUrl}/onboarding/approach" style="background-color: #4F46E5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-size: 16px; font-weight: bold;">
          🎯 Inizia il Setup
        </a>

        <p style="color: #666; font-size: 14px;">
          ⏱️ Tempo stimato: 5 minuti<br>
          🤖 L'AI genererà il tuo piano personalizzato al termine
        </p>

        <br>
        <p>Non vediamo l'ora di vederti crescere,<br><strong>Team ARVO</strong></p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          ARVO - AI Personal Trainer for Serious Lifters
        </p>
      `,
    };
  },

  /**
   * Email 2: Onboarding Completion Celebration
   * Triggered immediately after onboarding completion
   */
  onboardingComplete(data: OnboardingCompleteEmailData, appUrl: string): { subject: string; html: string } {
    const splitTypeNames: Record<string, string> = {
      push_pull_legs: 'Push/Pull/Legs',
      upper_lower: 'Upper/Lower',
      full_body: 'Full Body',
      bro_split: 'Bro Split',
      weak_point_focus: 'Weak Point Focus',
    };

    return {
      subject: '✅ Setup Completato - Il Tuo Piano è Pronto!',
      html: `
        <h2>Complimenti ${data.firstName}, il tuo piano è pronto! 🎉</h2>

        <p>Hai completato il setup con successo. L'AI ha generato il tuo piano di allenamento personalizzato.</p>

        <h3>📋 Riepilogo del Tuo Piano</h3>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>🎯 Metodologia:</strong> ${data.approachName}</p>
          <p style="margin: 8px 0;"><strong>📅 Split:</strong> ${splitTypeNames[data.splitType] || data.splitType}</p>
          <p style="margin: 8px 0;"><strong>📊 Frequenza:</strong> ${data.weeklyFrequency} sessioni/settimana</p>
          ${
            data.weakPoints.length > 0
              ? `<p style="margin: 8px 0;"><strong>💪 Weak Points:</strong> ${data.weakPoints.join(', ')}</p>`
              : ''
          }
        </div>

        <h3>🏋️ Il Tuo Primo Workout è Pronto</h3>
        <p>L'AI ha già generato il tuo primo allenamento basato su:</p>
        <ul>
          <li>Il tuo livello di esperienza e forza</li>
          <li>I tuoi weak points prioritari</li>
          <li>L'attrezzatura che hai a disposizione</li>
          <li>La metodologia ${data.approachName}</li>
        </ul>

        <br>
        <a href="${appUrl}/dashboard" style="background-color: #4F46E5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-size: 16px; font-weight: bold;">
          💪 Inizia il Primo Workout
        </a>

        <h3>💡 Tips per Massimizzare i Risultati</h3>
        <ul>
          <li><strong>Logga ogni set</strong> - L'AI impara dalle tue performance</li>
          <li><strong>Rispetta i RIR</strong> - Non andare a cedimento su ogni set</li>
          <li><strong>Note opzionali</strong> - Comunica all'AI come ti sei sentito</li>
          <li><strong>Progressive overload</strong> - L'AI aumenterà peso/volume automaticamente</li>
        </ul>

        <br>
        <p>Buon allenamento! 💪<br><strong>Team ARVO</strong></p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          ARVO - AI Personal Trainer for Serious Lifters
        </p>
      `,
    };
  },

  /**
   * Email 3: First Workout Reminder
   * Triggered 24h after onboarding if workout not started
   */
  firstWorkoutReminder(data: FirstWorkoutReminderEmailData, appUrl: string): { subject: string; html: string } {
    return {
      subject: '⏰ Il Tuo Workout Personalizzato Ti Aspetta!',
      html: `
        <h2>Ciao ${data.firstName}, pronto a iniziare? 💪</h2>

        <p>Il tuo primo workout personalizzato è pronto da ieri, ma non l'hai ancora iniziato.</p>

        <h3>🏋️ ${data.workoutName}</h3>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>🎯 Tipo:</strong> ${data.workoutType}</p>
          <p style="margin: 8px 0;"><strong>💪 Muscoli Target:</strong> ${data.targetMuscles.join(', ')}</p>
          <p style="margin: 8px 0;"><strong>⏱️ Durata Stimata:</strong> ${data.estimatedDuration} minuti</p>
        </div>

        <p>L'AI ha creato un piano perfetto per il tuo livello. Ogni esercizio, ogni set, ogni peso è calcolato per massimizzare i tuoi risultati.</p>

        <br>
        <a href="${appUrl}/workout/${data.workoutId}" style="background-color: #4F46E5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-size: 16px; font-weight: bold;">
          🚀 Inizia Ora
        </a>

        <p style="color: #666; font-size: 14px;">
          <strong>Troppo impegnato oggi?</strong> Nessun problema! Il workout rimarrà disponibile quando sei pronto.
        </p>

        <br>
        <p>A presto in palestra! 💪<br><strong>Team ARVO</strong></p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          ARVO - AI Personal Trainer for Serious Lifters
        </p>
      `,
    };
  },

  /**
   * Email 4: First Workout Complete Celebration
   * Triggered immediately after first workout completion
   */
  firstWorkoutComplete(data: FirstWorkoutCompleteEmailData, appUrl: string): { subject: string; html: string } {
    const hours = Math.floor(data.duration / 3600);
    const minutes = Math.floor((data.duration % 3600) / 60);
    const durationText = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} minuti`;

    return {
      subject: '🎉 Primo Workout Completato - Ottimo Lavoro!',
      html: `
        <h2>Complimenti ${data.firstName}! 💪🎉</h2>

        <p>Hai appena completato il tuo primo workout con ARVO. Questo è solo l'inizio del tuo percorso di trasformazione!</p>

        <h3>📊 Le Tue Statistiche</h3>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0; font-size: 18px;"><strong>🏋️ Volume Totale:</strong> <span style="color: #4F46E5; font-size: 24px; font-weight: bold;">${data.totalVolume.toFixed(0)} kg</span></p>
          <p style="margin: 8px 0;"><strong>⏱️ Durata:</strong> ${durationText}</p>
          <p style="margin: 8px 0;"><strong>💪 Sets Completati:</strong> ${data.totalSets}</p>
          <p style="margin: 8px 0;"><strong>🎯 Esercizi:</strong> ${data.exercisesCompleted}</p>
        </div>

        <h3>🤖 Come Funziona l'AI</h3>
        <p>Ora che hai completato il primo workout, ecco cosa succede dietro le quinte:</p>

        <ul>
          <li><strong>Analisi Performance</strong> - L'AI ha analizzato i tuoi pesi, RIR e note</li>
          <li><strong>Progressive Overload</strong> - Il prossimo workout sarà calibrato sui tuoi risultati</li>
          <li><strong>Personalizzazione</strong> - Ogni workout si adatta sempre più a te</li>
          <li><strong>Gestione Fatica</strong> - L'AI bilancia volume e intensità per evitare overtraining</li>
        </ul>

        <p style="background-color: #EEF2FF; padding: 16px; border-left: 4px solid #4F46E5; margin: 20px 0;">
          <strong>💡 Pro Tip:</strong> Più dati fornisci (note, sensazioni, RIR precisi), più l'AI diventa efficace nel creare workout perfetti per te!
        </p>

        <br>
        <a href="${appUrl}/progress" style="background-color: #4F46E5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-size: 16px; font-weight: bold;">
          📈 Vedi i Tuoi Progressi
        </a>

        <br><br>
        <p>Continua così! 🚀<br><strong>Team ARVO</strong></p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          ARVO - AI Personal Trainer for Serious Lifters
        </p>
      `,
    };
  },

  /**
   * Email 5: Weekly Progress Update
   * Triggered weekly to show progress
   */
  weeklyProgress(data: WeeklyProgressEmailData, appUrl: string): { subject: string; html: string } {
    return {
      subject: `📊 Week ${data.weekNumber} Recap - Ottimo Lavoro!`,
      html: `
        <h2>Ciao ${data.firstName}, ecco la tua settimana! 📊</h2>

        <p>Hai completato la settimana ${data.weekNumber} del tuo percorso. Vediamo i risultati:</p>

        <h3>📈 Statistiche Settimana ${data.weekNumber}</h3>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0; font-size: 18px;"><strong>💪 Workout Completati:</strong> <span style="color: #4F46E5; font-size: 24px; font-weight: bold;">${data.workoutsCompleted}</span></p>
          <p style="margin: 8px 0; font-size: 18px;"><strong>🏋️ Volume Totale:</strong> <span style="color: #4F46E5; font-size: 24px; font-weight: bold;">${data.totalVolume.toFixed(0)} kg</span></p>
          <p style="margin: 8px 0;"><strong>🎯 Gruppi Muscolari:</strong> ${data.muscleGroupsTrained.join(', ')}</p>
          <p style="margin: 8px 0;"><strong>📅 Progresso Ciclo:</strong> Giorno ${data.currentCycleDay} di ${data.cycleTotalDays}</p>
        </div>

        ${
          data.currentCycleDay >= data.cycleTotalDays - 2
            ? `
        <div style="background-color: #FEF3C7; padding: 16px; border-left: 4px solid #F59E0B; margin: 20px 0;">
          <strong>🎯 Quasi al traguardo!</strong> Sei a ${data.cycleTotalDays - data.currentCycleDay} workout dal completare il tuo primo ciclo completo!
        </div>
        `
            : ''
        }

        <h3>💡 Focus per la Prossima Settimana</h3>
        <ul>
          <li>Continua a loggare i tuoi RIR in modo preciso</li>
          <li>Lascia note se senti qualcosa di insolito</li>
          <li>Monitora i tuoi progressi su volume e pesi</li>
          <li>Mantieni la consistenza - la magia sta nella ripetizione</li>
        </ul>

        <br>
        <a href="${appUrl}/dashboard" style="background-color: #4F46E5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-size: 16px; font-weight: bold;">
          💪 Continua ad Allenarti
        </a>

        <br><br>
        <p>Keep crushing it! 🚀<br><strong>Team ARVO</strong></p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          ARVO - AI Personal Trainer for Serious Lifters
        </p>
      `,
    };
  },

  /**
   * Email 6: First Cycle Completion Milestone
   * Triggered when user completes their first full cycle
   */
  cycleComplete(data: CycleCompleteEmailData, appUrl: string): { subject: string; html: string } {
    const hours = Math.floor(data.totalDuration / 3600);
    const durationText = `${hours} ore in palestra`;

    const topMuscles = Object.entries(data.volumeByMuscleGroup)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([muscle, volume]) => `<li><strong>${muscle}:</strong> ${volume.toFixed(0)} kg</li>`)
      .join('');

    return {
      subject: '🏆 MILESTONE: Primo Ciclo Completato!',
      html: `
        <h2>🏆 INCREDIBILE ${data.firstName.toUpperCase()}! 🏆</h2>

        <p>Hai appena completato il tuo <strong>primo ciclo completo</strong> di allenamento con ARVO!</p>

        <p style="font-size: 18px; color: #4F46E5; font-weight: bold;">
          Questo è un traguardo importante - la maggior parte delle persone non arriva mai a questo punto. Ma tu l'hai fatto! 💪
        </p>

        <h3>📊 Statistiche Ciclo ${data.cycleNumber}</h3>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0; font-size: 20px;"><strong>🏋️ Volume Totale:</strong> <span style="color: #4F46E5; font-size: 28px; font-weight: bold;">${data.totalVolume.toFixed(0)} kg</span></p>
          <p style="margin: 8px 0;"><strong>💪 Workout Completati:</strong> ${data.workoutsCompleted}</p>
          <p style="margin: 8px 0;"><strong>⏱️ Tempo Totale:</strong> ${durationText}</p>
          <p style="margin: 8px 0;"><strong>🧠 Mental Readiness Media:</strong> ${data.avgMentalReadiness.toFixed(1)}/5</p>
        </div>

        <h3>🎯 Volume per Gruppo Muscolare</h3>
        <div style="background-color: #EEF2FF; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin-bottom: 12px;"><strong>Top 3 Gruppi Allenati:</strong></p>
          <ul style="margin: 0;">
            ${topMuscles}
          </ul>
        </div>

        <h3>🚀 Cosa Succede Ora?</h3>
        <p>L'AI ha analizzato tutte le tue performance e sta già preparando il <strong>Ciclo 2</strong> ottimizzato per te:</p>

        <ul>
          <li><strong>Progressive Overload</strong> - Pesi e volume calibrati sui tuoi risultati</li>
          <li><strong>Weak Points Prioritized</strong> - Focus sui muscoli che hai indicato</li>
          <li><strong>Fatigue Management</strong> - Bilanciamento volume/intensità perfetto</li>
          <li><strong>Personalizzazione Avanzata</strong> - L'AI ti conosce sempre meglio</li>
        </ul>

        <br>
        <a href="${appUrl}/dashboard" style="background-color: #4F46E5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-size: 16px; font-weight: bold;">
          🎯 Inizia Ciclo ${data.cycleNumber + 1}
        </a>

        <p style="background-color: #DCFCE7; padding: 16px; border-left: 4px solid #22C55E; margin: 20px 0;">
          <strong>💪 Remember:</strong> La crescita muscolare è un gioco di consistenza. Continua così e i risultati arriveranno!
        </p>

        <br><br>
        <p>Siamo fieri di te! 🚀<br><strong>Team ARVO</strong></p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          ARVO - AI Personal Trainer for Serious Lifters
        </p>
      `,
    };
  },

  /**
   * Email 7: Re-engagement
   * Triggered when user is inactive for 7+ days
   */
  reengagement(data: ReengagementEmailData, appUrl: string): { subject: string; html: string } {
    return {
      subject: '💪 Ti Abbiamo Perso in Palestra!',
      html: `
        <h2>Ciao ${data.firstName}, ti stiamo aspettando! 💪</h2>

        <p>Sono passati <strong>${data.daysSinceLastWorkout} giorni</strong> dal tuo ultimo workout (${data.lastWorkoutType}).</p>

        <p style="font-size: 16px;">
          Sappiamo che la vita può essere impegnativa, ma ricorda: <strong>la consistenza batte l'intensità</strong>. Anche un workout breve è meglio di niente!
        </p>

        <h3>🎯 Il Tuo Prossimo Workout Ti Aspetta</h3>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>📋 Workout:</strong> ${data.nextWorkoutName}</p>
          <p style="margin: 8px 0;"><strong>📅 Ciclo:</strong> Giorno ${data.currentCycleDay}</p>
          <p style="margin: 8px 0;"><strong>⏱️ Quando ti va:</strong> L'AI ha generato il workout perfetto per te</p>
        </div>

        <h3>💡 Consigli per Riprendere</h3>
        <ul>
          <li><strong>Inizia leggero</strong> - Dopo una pausa, meglio non esagerare</li>
          <li><strong>Ascolta il corpo</strong> - L'AI si adatterà alle tue condizioni</li>
          <li><strong>Costanza > Perfezione</strong> - 3 workout medi battono 1 perfetto</li>
          <li><strong>Nessun giudizio</strong> - Siamo qui per aiutarti, non per giudicarti</li>
        </ul>

        <br>
        <a href="${appUrl}/dashboard" style="background-color: #4F46E5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-size: 16px; font-weight: bold;">
          💪 Riprendi l'Allenamento
        </a>

        <p style="background-color: #FEF3C7; padding: 16px; border-left: 4px solid #F59E0B; margin: 20px 0;">
          <strong>Remember:</strong> Non importa quanto sei stato fermo. Quello che conta è che ricominci oggi! 🚀
        </p>

        <br><br>
        <p>Ti aspettiamo in palestra! 💪<br><strong>Team ARVO</strong></p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          ARVO - AI Personal Trainer for Serious Lifters<br>
          <a href="${appUrl}/settings" style="color: #666; text-decoration: underline;">Gestisci preferenze email</a>
        </p>
      `,
    };
  },

  /**
   * Email 8: Settings Update Confirmation
   * Triggered when user updates important settings
   */
  settingsUpdate(data: SettingsUpdateEmailData, appUrl: string): { subject: string; html: string } {
    return {
      subject: '✅ Settings Aggiornati - ' + data.settingChanged,
      html: `
        <h2>Settings Aggiornati con Successo! ✅</h2>

        <p>Ciao ${data.firstName}, hai modificato le tue impostazioni di allenamento.</p>

        <h3>🔄 Modifiche Applicate</h3>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>📝 Setting:</strong> ${data.settingChanged}</p>
          <p style="margin: 8px 0;"><strong>🔴 Prima:</strong> <span style="text-decoration: line-through;">${data.oldValue}</span></p>
          <p style="margin: 8px 0;"><strong>🟢 Ora:</strong> <span style="color: #22C55E; font-weight: bold;">${data.newValue}</span></p>
        </div>

        <h3>💡 Impatto sui Tuoi Workout</h3>
        <p>${data.impact}</p>

        <p style="background-color: #EEF2FF; padding: 16px; border-left: 4px solid #4F46E5; margin: 20px 0;">
          <strong>🤖 L'AI si adatterà:</strong> I prossimi workout saranno generati con le nuove impostazioni per ottimizzare i tuoi risultati.
        </p>

        <br>
        <a href="${appUrl}/dashboard" style="background-color: #4F46E5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-size: 16px; font-weight: bold;">
          📊 Vai al Dashboard
        </a>

        <br><br>
        <p>Buon allenamento! 💪<br><strong>Team ARVO</strong></p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          ARVO - AI Personal Trainer for Serious Lifters<br>
          <a href="${appUrl}/settings" style="color: #666; text-decoration: underline;">Modifica altre impostazioni</a>
        </p>
      `,
    };
  },
};

export type {
  WelcomeEmailData,
  OnboardingCompleteEmailData,
  FirstWorkoutReminderEmailData,
  FirstWorkoutCompleteEmailData,
  WeeklyProgressEmailData,
  CycleCompleteEmailData,
  ReengagementEmailData,
  SettingsUpdateEmailData,
};
