"use client";

import { useState } from "react";
import { Sparkles, Globe, Loader2, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";
import { extractBrandingFromUrlAction } from "@/app/actions/ai-actions";
import { hslToHex, parseHSL } from "@/lib/utils/color-scale";
import type { ExtractedBranding } from "@/lib/types/branding-extraction.types";

interface AiBrandingSectionProps {
  onApply: (branding: Partial<ExtractedBranding>) => void;
}

export function AiBrandingSection({ onApply }: AiBrandingSectionProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedBranding | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("Inserisci un URL valido");
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const result = await extractBrandingFromUrlAction(url);

      if (result.success && result.data) {
        setExtractedData(result.data);
        toast({
          title: "Analisi completata",
          description: "Branding estratto con successo",
        });
      } else {
        setError(result.error || "Errore durante l'analisi");
      }
    } catch (err) {
      setError("Errore di connessione");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (extractedData) {
      onApply(extractedData);
      toast({
        title: "Applicato",
        description: "I dati estratti sono stati applicati al form",
      });
    }
  };

  // Convert HSL string to hex for display
  const hslToHexDisplay = (hslString: string | null): string => {
    if (!hslString) return "#808080";
    const hsl = parseHSL(hslString);
    if (!hsl) return "#808080";
    return hslToHex(hsl.h, hsl.s, hsl.l);
  };

  return (
    <Card className="border-dashed border-2 border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900">
            <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Importa da Sito Web</CardTitle>
            <CardDescription>
              Inserisci l&apos;URL del tuo sito per estrarre automaticamente il branding
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Input */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="website-url" className="sr-only">
              URL del sito
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="website-url"
                type="url"
                placeholder="https://www.tuosito.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>
          <Button onClick={handleAnalyze} disabled={isLoading || !url.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisi...
              </>
            ) : (
              "Analizza"
            )}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Results Preview */}
        {extractedData && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
              Dati Estratti
            </h4>

            {/* App Name */}
            {extractedData.app_name && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Nome</span>
                <span className="font-medium">{extractedData.app_name}</span>
              </div>
            )}

            {/* Tagline */}
            {extractedData.tagline && (
              <div className="flex justify-between items-start gap-4">
                <span className="text-sm text-gray-500 shrink-0">Tagline</span>
                <span className="text-sm text-right line-clamp-2">
                  {extractedData.tagline}
                </span>
              </div>
            )}

            {/* Colors */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Colori</span>
              <div className="flex gap-2">
                {extractedData.primary_color && (
                  <div
                    className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: hslToHexDisplay(extractedData.primary_color) }}
                    title={`Primario: ${extractedData.primary_color}`}
                  />
                )}
                {extractedData.secondary_color && (
                  <div
                    className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: hslToHexDisplay(extractedData.secondary_color) }}
                    title={`Secondario: ${extractedData.secondary_color}`}
                  />
                )}
                {extractedData.accent_color && (
                  <div
                    className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: hslToHexDisplay(extractedData.accent_color) }}
                    title={`Accento: ${extractedData.accent_color}`}
                  />
                )}
                {!extractedData.primary_color &&
                  !extractedData.secondary_color &&
                  !extractedData.accent_color && (
                    <span className="text-sm text-gray-400">Nessun colore trovato</span>
                  )}
              </div>
            </div>

            {/* Font */}
            {extractedData.font_family && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Font</span>
                <span className="font-medium" style={{ fontFamily: extractedData.font_family }}>
                  {extractedData.font_family}
                </span>
              </div>
            )}

            {/* Logo */}
            {extractedData.logo_url && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Logo</span>
                <img
                  src={extractedData.logo_url}
                  alt="Logo"
                  className="h-8 w-auto max-w-[120px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Apply Button */}
            <Button onClick={handleApply} className="w-full mt-4" variant="default">
              <Check className="w-4 h-4 mr-2" />
              Applica al Branding
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
