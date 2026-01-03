import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Crown, XCircle } from "lucide-react";

export default function AdminPartnerships() {
  // Auth check
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <XCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-neutral-700">Access Denied</h2>
        <p className="text-neutral-500">Admin privileges required</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif">Partnership Management</h1>
        <p className="text-neutral-500">Informations de contact pour les partenariats</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-medium">Devenir Partenaire</h2>
              <p className="text-neutral-500">Rejoignez notre programme de partenariat</p>
            </div>
          </div>
          
          <div className="bg-neutral-50 rounded-lg p-6 space-y-4">
            <p className="text-neutral-700">
              Pour toute demande de partenariat, veuillez nous contacter à l'adresse suivante :
            </p>
            <a 
              href="mailto:inferencevision@inferencevision.store" 
              className="text-lg font-medium text-amber-800 hover:underline block"
            >
              inferencevision@inferencevision.store
            </a>
            <p className="text-sm text-neutral-500">
              Notre équipe vous répondra dans les plus brefs délais.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}