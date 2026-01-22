import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Heart } from "lucide-react";

const outfits = [
  {
    user: "Clara L.",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
    caption: "Silhouette minimaliste, blazer ivoire et collier fin",
  },
  {
    user: "Adam V.",
    image:
      "https://images.unsplash.com/photo-1516822003754-cca485356ecb?auto=format&fit=crop&w=900&q=80",
    caption: "Casual chic: denim brut, tee blanc et gourmette",
  },
  {
    user: "Maya R.",
    image:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
    caption: "Robe satinée et boucles dorées sculpturales",
  },
  {
    user: "Zoé A.",
    image:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
    caption: "Monochrome noir, bague statement",
  },
];

const jewelry = [
  {
    user: "Nora G.",
    image:
      "https://images.unsplash.com/photo-1516637090014-cb1ab0d08fc7?auto=format&fit=crop&w=900&q=80",
    caption: "Superposition de colliers or 18k",
  },
  {
    user: "Camille D.",
    image:
      "https://images.unsplash.com/photo-1520962918287-7448c2878f65?auto=format&fit=crop&w=900&q=80",
    caption: "Créoles martelées et chemise soie",
  },
  {
    user: "Elia P.",
    image:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=80",
    caption: "Empilement de bagues minimalistes",
  },
  {
    user: "Léa S.",
    image:
      "https://images.unsplash.com/photo-1535632785830-3cbd1dba7f1c?auto=format&fit=crop&w=900&q=80",
    caption: "Bracelet manchette et top satin",
  },
];

export default function FauxUsersShowcase() {
  return (
    <div className="space-y-10 mb-10">
      {/* Tenues portées */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <h2 className="text-xl font-serif text-neutral-900">
            Tenues portées
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {outfits.map((o, i) => (
            <Card key={i} className="overflow-hidden group">
              <div className="relative aspect-[3/4] bg-neutral-100">

                <div className="absolute top-3 left-3">
                  <Badge className="bg-white/90 text-neutral-800">{o.user}</Badge>
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white text-xs">
                  {o.caption}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Bijoux portés */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-rose-500" />
          <h2 className="text-xl font-serif text-neutral-900">
            Bijoux portés
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {jewelry.map((j, i) => (
            <Card key={i} className="overflow-hidden group">
              <div className="relative aspect-[3/4] bg-neutral-100">

                <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-white/90 text-neutral-800">{j.user}</Badge>
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white text-xs">
                  {j.caption}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}