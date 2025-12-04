"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Building2, Mail, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/lib/hooks/use-toast";

const gymSetupSchema = z.object({
  name: z.string().min(1, "Il nome della palestra è obbligatorio").max(100),
  description: z.string().max(500).optional(),
  email: z.string().email("Inserisci un'email valida").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url("Inserisci un URL valido").optional().or(z.literal("")),
});

type GymSetupFormData = z.infer<typeof gymSetupSchema>;

export function GymSetupForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GymSetupFormData>({
    resolver: zodResolver(gymSetupSchema),
    defaultValues: {
      name: "",
      description: "",
      email: "",
      phone: "",
      website: "",
    },
  });

  const onSubmit = async (data: GymSetupFormData) => {
    setIsSubmitting(true);

    try {
      // Clean up empty strings
      const cleanData = {
        name: data.name,
        description: data.description || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        website: data.website || undefined,
      };

      const response = await fetch("/api/gym/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Errore durante la creazione");
      }

      toast({
        title: "Palestra creata!",
        description: `${data.name} è stata creata con successo.`,
      });

      // Redirect to gym admin dashboard
      router.push("/gym-admin");
      router.refresh();
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante la creazione della palestra",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <CardTitle className="text-2xl">Crea la tua palestra</CardTitle>
        <CardDescription>
          Inserisci le informazioni della tua palestra per iniziare
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome palestra <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Es. Fitness Club Roma"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              placeholder="Una breve descrizione della tua palestra..."
              rows={3}
              {...register("description")}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              Email di contatto
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="info@tuapalestra.com"
              {...register("email")}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              Telefono
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+39 06 1234567"
              {...register("phone")}
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              Sito web
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://www.tuapalestra.com"
              {...register("website")}
              className={errors.website ? "border-red-500" : ""}
            />
            {errors.website && (
              <p className="text-sm text-red-500">{errors.website.message}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creazione in corso...
              </>
            ) : (
              "Crea palestra"
            )}
          </Button>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Potrai personalizzare logo, colori e altri dettagli dopo la creazione.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
