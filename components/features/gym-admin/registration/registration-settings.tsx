"use client";

import { useState } from "react";
import { Copy, Check, Link2, QrCode, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";

interface RegistrationSettingsProps {
  gymId: string;
  gymSlug: string;
  inviteCode: string;
}

export function RegistrationSettings({
  gymId,
  gymSlug,
  inviteCode,
}: RegistrationSettingsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate full URLs
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const registrationUrl = `${baseUrl}/join/gym/${gymSlug}`;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copiato!",
        description: "Il testo è stato copiato negli appunti",
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile copiare il testo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Registration Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Link di Registrazione
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Condividi questo link con i tuoi clienti per farli registrare direttamente
            nella tua palestra. Vedranno il tuo branding personalizzato.
          </p>
          <div className="flex gap-2">
            <Input value={registrationUrl} readOnly className="font-mono text-sm" />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(registrationUrl, "url")}
            >
              {copiedField === "url" ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(registrationUrl, "_blank")}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invite Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Codice Invito
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            I clienti possono anche inserire questo codice durante la registrazione
            per essere associati alla tua palestra.
          </p>
          <div className="flex gap-2 items-center">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg flex-1 max-w-xs">
              <span className="font-mono text-2xl font-bold tracking-wider text-gray-900 dark:text-white">
                {inviteCode}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => copyToClipboard(inviteCode, "code")}
            >
              {copiedField === "code" ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Copia
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Share options */}
      <Card>
        <CardHeader>
          <CardTitle>Condividi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Usa questi pulsanti per condividere rapidamente il link di registrazione.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const text = `Unisciti alla nostra palestra su Arvo! ${registrationUrl}`;
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(text)}`,
                  "_blank"
                );
              }}
            >
              WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const text = `Unisciti alla nostra palestra su Arvo! ${registrationUrl}`;
                window.open(
                  `https://t.me/share/url?url=${encodeURIComponent(registrationUrl)}&text=${encodeURIComponent("Unisciti alla nostra palestra!")}`,
                  "_blank"
                );
              }}
            >
              Telegram
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const subject = "Unisciti alla nostra palestra!";
                const body = `Ciao!\n\nRegistrati su Arvo per iniziare ad allenarti con noi:\n${registrationUrl}\n\nOppure usa il codice: ${inviteCode}`;
                window.open(
                  `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
                  "_blank"
                );
              }}
            >
              Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiche Registrazioni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
              <p className="text-sm text-gray-500">Oggi</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
              <p className="text-sm text-gray-500">Questa settimana</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
              <p className="text-sm text-gray-500">Questo mese</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
              <p className="text-sm text-gray-500">Totale</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
