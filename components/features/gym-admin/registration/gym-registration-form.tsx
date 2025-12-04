"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GymBrandingWrapper } from "@/components/providers/gym-branding-provider";
import { GymService } from "@/lib/services/gym.service";
import { AuthService } from "@/lib/services/auth.service";
import { useToast } from "@/lib/hooks/use-toast";
import { useLocaleStore } from "@/lib/stores/locale.store";

interface GymRegistrationFormProps {
  gymId: string;
  gymName: string;
  gymDescription: string | null;
  branding: {
    logo_url: string | null;
    logo_dark_url: string | null;
    splash_image_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    accent_color: string | null;
    font_family: string | null;
    welcome_message: { en?: string; it?: string } | null;
    tagline: { en?: string; it?: string } | null;
    app_name: string | null;
  };
  slug: string;
  isLoggedIn: boolean;
  userId?: string;
}

export function GymRegistrationForm({
  gymId,
  gymName,
  gymDescription,
  branding,
  slug,
  isLoggedIn,
  userId,
}: GymRegistrationFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { locale } = useLocaleStore();

  // Get localized welcome message
  const welcomeMessage = useMemo(() => {
    if (!branding.welcome_message) return null;
    return branding.welcome_message[locale as keyof typeof branding.welcome_message] ||
      branding.welcome_message.en ||
      branding.welcome_message.it;
  }, [branding.welcome_message, locale]);

  // Get localized tagline
  const tagline = useMemo(() => {
    if (!branding.tagline) return null;
    return branding.tagline[locale as keyof typeof branding.tagline] ||
      branding.tagline.en ||
      branding.tagline.it;
  }, [branding.tagline, locale]);

  // Handle registration for already logged-in users
  const handleJoinAsLoggedInUser = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      await GymService.registerMemberBySlug(userId, slug);
      toast({
        title: "Benvenuto!",
        description: `Sei ora membro di ${gymName}`,
      });
      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante la registrazione",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle magic link request for new users
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Errore",
        description: "Inserisci un indirizzo email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Store the gym slug in session storage so we can use it after auth
      sessionStorage.setItem("gym_registration_slug", slug);

      // Send magic link
      await AuthService.sendMagicLink(email);

      setEmailSent(true);
      toast({
        title: "Email inviata!",
        description: "Controlla la tua casella di posta per completare la registrazione",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore nell'invio dell'email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GymBrandingWrapper branding={branding}>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {/* Logo */}
        {branding.logo_url && (
          <div className="mb-8">
            <img
              src={branding.logo_url}
              alt={gymName}
              className="h-16 md:h-20 object-contain dark:hidden"
            />
            {branding.logo_dark_url && (
              <img
                src={branding.logo_dark_url}
                alt={gymName}
                className="h-16 md:h-20 object-contain hidden dark:block"
              />
            )}
          </div>
        )}

        {/* Card */}
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {branding.app_name || gymName}
            </h1>
            {tagline && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {tagline}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Welcome message */}
            {welcomeMessage && (
              <p className="text-center text-gray-700 dark:text-gray-300">
                {welcomeMessage}
              </p>
            )}

            {/* Description */}
            {gymDescription && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {gymDescription}
              </p>
            )}

            {/* Email sent state */}
            {emailSent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Controlla la tua email
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Abbiamo inviato un link di accesso a <strong>{email}</strong>
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setEmailSent(false)}
                  className="w-full"
                >
                  Usa un&apos;altra email
                </Button>
              </div>
            ) : isLoggedIn ? (
              // Already logged in - just join
              <div className="space-y-4">
                <p className="text-center text-gray-600 dark:text-gray-400">
                  Sei già loggato. Clicca qui sotto per unirti a {gymName}.
                </p>
                <Button
                  onClick={handleJoinAsLoggedInUser}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Registrazione in corso...
                    </>
                  ) : (
                    <>
                      Unisciti a {gymName}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            ) : (
              // Not logged in - show email form
              <form onSubmit={handleSendMagicLink} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="la-tua@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      Continua con Email
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Riceverai un link magico per accedere. Nessuna password richiesta.
                </p>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Powered by Arvo */}
        <p className="mt-8 text-xs text-gray-400">
          Powered by{" "}
          <a
            href="https://arvo.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-gray-600"
          >
            Arvo
          </a>
        </p>
      </div>
    </GymBrandingWrapper>
  );
}
