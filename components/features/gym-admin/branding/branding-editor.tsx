"use client";

import { useEffect, useState, useCallback } from "react";
import { Upload, X, Check, Loader2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GymService } from "@/lib/services/gym.service";
import { GymBrandingService } from "@/lib/services/gym-branding.service";
import type { GymBranding } from "@/lib/types/gym.types";
import { parseHSL, formatHSL, hslToHex, hexToHSL } from "@/lib/utils/color-scale";
import { useToast } from "@/lib/hooks/use-toast";
import { AiBrandingSection } from "./ai-branding-section";
import type { ExtractedBranding } from "@/lib/types/branding-extraction.types";

interface BrandingEditorProps {
  gymId: string;
}

export function BrandingEditor({ gymId }: BrandingEditorProps) {
  const [branding, setBranding] = useState<GymBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#94a3b8");
  const [accentColor, setAccentColor] = useState("#22c55e");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [tagline, setTagline] = useState("");
  const [fontFamily, setFontFamily] = useState("");
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  // Debug: log state changes
  useEffect(() => {
    console.log("[BrandingEditor] State updated:", { primaryColor, secondaryColor, accentColor, tagline, fontFamily });
  }, [primaryColor, secondaryColor, accentColor, tagline, fontFamily]);

  // Load branding data - only once on mount
  useEffect(() => {
    if (hasLoadedInitialData) return;

    async function loadBranding() {
      try {
        const data = await GymService.getBranding(gymId);
        setBranding(data);

        // Initialize form with current values
        if (data) {
          if (data.primary_color) {
            const hsl = parseHSL(data.primary_color);
            if (hsl) setPrimaryColor(hslToHex(hsl.h, hsl.s, hsl.l));
          }
          if (data.secondary_color) {
            const hsl = parseHSL(data.secondary_color);
            if (hsl) setSecondaryColor(hslToHex(hsl.h, hsl.s, hsl.l));
          }
          if (data.accent_color) {
            const hsl = parseHSL(data.accent_color);
            if (hsl) setAccentColor(hslToHex(hsl.h, hsl.s, hsl.l));
          }
          setWelcomeMessage(data.welcome_message?.it || data.welcome_message?.en || "");
          setTagline(data.tagline?.it || data.tagline?.en || "");
          setFontFamily(data.font_family || "");
        }
        setHasLoadedInitialData(true);
      } catch (error) {
        console.error("Failed to load branding:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare il branding",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadBranding();
  }, [gymId, toast, hasLoadedInitialData]);

  // Handle logo upload
  const handleLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, variant: "light" | "dark") => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingField(variant === "dark" ? "logo_dark" : "logo");
      try {
        const url = await GymBrandingService.uploadLogo(gymId, file, variant);
        setBranding((prev) =>
          prev
            ? {
                ...prev,
                [variant === "dark" ? "logo_dark_url" : "logo_url"]: url,
              }
            : null
        );
        toast({
          title: "Logo caricato",
          description: "Il logo è stato aggiornato con successo",
        });
      } catch (error) {
        toast({
          title: "Errore",
          description: error instanceof Error ? error.message : "Errore nel caricamento",
          variant: "destructive",
        });
      } finally {
        setUploadingField(null);
      }
    },
    [gymId, toast]
  );

  // Handle favicon upload
  const handleFaviconUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingField("favicon");
      try {
        const url = await GymBrandingService.uploadFavicon(gymId, file);
        setBranding((prev) => (prev ? { ...prev, favicon_url: url } : null));
        toast({
          title: "Favicon caricata",
          description: "La favicon è stata aggiornata con successo",
        });
      } catch (error) {
        toast({
          title: "Errore",
          description: error instanceof Error ? error.message : "Errore nel caricamento",
          variant: "destructive",
        });
      } finally {
        setUploadingField(null);
      }
    },
    [gymId, toast]
  );

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert hex colors to HSL
      const primaryHSL = hexToHSL(primaryColor);
      const secondaryHSL = hexToHSL(secondaryColor);
      const accentHSL = hexToHSL(accentColor);

      await GymBrandingService.updateBranding(gymId, {
        primary_color: primaryHSL ? formatHSL(primaryHSL.h, primaryHSL.s, primaryHSL.l) : null,
        secondary_color: secondaryHSL ? formatHSL(secondaryHSL.h, secondaryHSL.s, secondaryHSL.l) : null,
        accent_color: accentHSL ? formatHSL(accentHSL.h, accentHSL.s, accentHSL.l) : null,
        welcome_message: welcomeMessage ? { it: welcomeMessage, en: welcomeMessage } : null,
        tagline: tagline ? { it: tagline, en: tagline } : null,
        font_family: fontFamily || null,
      });

      toast({
        title: "Salvato",
        description: "Le modifiche sono state salvate con successo",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle apply extracted branding from AI
  const handleApplyExtractedBranding = useCallback((extracted: Partial<ExtractedBranding>) => {
    console.log("[BrandingEditor] Applying extracted branding:", extracted);

    // Apply colors (convert HSL to hex for form state)
    if (extracted.primary_color) {
      const hsl = parseHSL(extracted.primary_color);
      console.log("[BrandingEditor] Primary color:", { input: extracted.primary_color, parsed: hsl });
      if (hsl) {
        const hex = hslToHex(hsl.h, hsl.s, hsl.l);
        console.log("[BrandingEditor] Setting primary to hex:", hex);
        setPrimaryColor(hex);
      }
    }
    if (extracted.secondary_color) {
      const hsl = parseHSL(extracted.secondary_color);
      console.log("[BrandingEditor] Secondary color:", { input: extracted.secondary_color, parsed: hsl });
      if (hsl) {
        const hex = hslToHex(hsl.h, hsl.s, hsl.l);
        console.log("[BrandingEditor] Setting secondary to hex:", hex);
        setSecondaryColor(hex);
      }
    }
    if (extracted.accent_color) {
      const hsl = parseHSL(extracted.accent_color);
      console.log("[BrandingEditor] Accent color:", { input: extracted.accent_color, parsed: hsl });
      if (hsl) {
        const hex = hslToHex(hsl.h, hsl.s, hsl.l);
        console.log("[BrandingEditor] Setting accent to hex:", hex);
        setAccentColor(hex);
      }
    }

    // Apply texts
    if (extracted.tagline) {
      console.log("[BrandingEditor] Setting tagline:", extracted.tagline);
      setTagline(extracted.tagline);
    }
    if (extracted.welcome_message) {
      console.log("[BrandingEditor] Setting welcome_message:", extracted.welcome_message);
      setWelcomeMessage(extracted.welcome_message);
    }

    // Apply font
    if (extracted.font_family) {
      console.log("[BrandingEditor] Setting font_family:", extracted.font_family);
      setFontFamily(extracted.font_family);
    }
  }, []);

  // Handle reset branding
  const handleReset = async () => {
    setShowResetDialog(false);
    setIsResetting(true);
    try {
      const resetBranding = await GymBrandingService.resetBranding(gymId);
      setBranding(resetBranding);

      // Reset form state to defaults
      setPrimaryColor("#3b82f6");
      setSecondaryColor("#94a3b8");
      setAccentColor("#22c55e");
      setWelcomeMessage("");
      setTagline("");
      setFontFamily("");

      toast({
        title: "Branding resettato",
        description: "Tutti i valori sono stati ripristinati ai default",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile resettare il branding",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Branding Section */}
      <AiBrandingSection onApply={handleApplyExtractedBranding} />

      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Light logo */}
            <div>
              <Label>Logo (tema chiaro)</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center">
                {branding?.logo_url ? (
                  <div className="relative inline-block">
                    <img
                      src={branding.logo_url}
                      alt="Logo"
                      className="max-h-24 mx-auto"
                    />
                    <button
                      onClick={() => GymBrandingService.deleteLogo(gymId, "light")}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, "light")}
                      className="hidden"
                    />
                    {uploadingField === "logo" ? (
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          Clicca per caricare
                        </p>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>

            {/* Dark logo */}
            <div>
              <Label>Logo (tema scuro)</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center bg-gray-900">
                {branding?.logo_dark_url ? (
                  <div className="relative inline-block">
                    <img
                      src={branding.logo_dark_url}
                      alt="Logo dark"
                      className="max-h-24 mx-auto"
                    />
                    <button
                      onClick={() => GymBrandingService.deleteLogo(gymId, "dark")}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, "dark")}
                      className="hidden"
                    />
                    {uploadingField === "logo_dark" ? (
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-gray-500" />
                        <p className="mt-2 text-sm text-gray-400">
                          Clicca per caricare
                        </p>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Favicon */}
          <div>
            <Label>Favicon</Label>
            <div className="mt-2 flex items-center gap-4">
              {branding?.favicon_url && (
                <img
                  src={branding.favicon_url}
                  alt="Favicon"
                  className="w-8 h-8"
                />
              )}
              <label className="cursor-pointer inline-flex items-center justify-center rounded-md font-medium transition-colors h-9 px-3 border border-input bg-background hover:bg-muted">
                <input
                  type="file"
                  accept="image/png,image/x-icon,image/svg+xml"
                  onChange={handleFaviconUpload}
                  className="hidden"
                />
                {uploadingField === "favicon" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {branding?.favicon_url ? "Cambia" : "Carica"}
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors Section */}
      <Card>
        <CardHeader>
          <CardTitle>Colori</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="primaryColor">Colore Primario</Label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  id="primaryColor"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="secondaryColor">Colore Secondario</Label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  id="secondaryColor"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accentColor">Colore Accento</Label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  id="accentColor"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tipografia</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="fontFamily">Font (Google Fonts)</Label>
            <Input
              id="fontFamily"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              placeholder="es. Inter, Roboto, Open Sans"
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Inserisci il nome di un font da Google Fonts
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Texts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Testi Personalizzati</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="welcomeMessage">Messaggio di Benvenuto</Label>
            <Textarea
              id="welcomeMessage"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Benvenuto nella nostra palestra!"
              className="mt-2"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Il tuo slogan..."
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" disabled={isResetting || isSaving} onClick={() => setShowResetDialog(true)}>
          {isResetting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Reset...
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </>
          )}
        </Button>

        <Button onClick={handleSave} disabled={isSaving || isResetting}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Salvataggio...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Salva Modifiche
            </>
          )}
        </Button>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resettare il branding?</DialogTitle>
            <DialogDescription>
              Questa azione ripristinerà tutti i colori e testi ai valori default
              ed eliminerà i loghi e la favicon caricati. L&apos;operazione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Resetta tutto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
