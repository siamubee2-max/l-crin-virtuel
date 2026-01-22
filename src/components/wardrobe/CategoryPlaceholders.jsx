import React from "react";
import { Card } from "@/components/ui/card";

const categories = [
  { key: "top", label: "Haut", image: "https://source.unsplash.com/featured/600x800?tshirt,isolated,white-background" },
  { key: "bottom", label: "Bas", image: "https://source.unsplash.com/featured/600x800?trousers,isolated,white-background" },
  { key: "skirt", label: "Jupe", image: "https://source.unsplash.com/featured/600x800?skirt,isolated,white-background" },
  { key: "dress", label: "Robe", image: "https://source.unsplash.com/featured/600x800?dress,isolated,white-background" },
  { key: "hat", label: "Chapeau", image: "https://source.unsplash.com/featured/600x800?hat,isolated,white-background" },
  { key: "bag", label: "Sac", image: "https://source.unsplash.com/featured/600x800?handbag,isolated,white-background" },
  { key: "jacket", label: "Veste", image: "https://source.unsplash.com/featured/600x800?jacket,isolated,white-background" },
  { key: "shoes", label: "Chaussures", image: "https://source.unsplash.com/featured/600x800?shoes,isolated,white-background" },
  { key: "lingerie", label: "Lingerie", image: "https://source.unsplash.com/featured/600x800?lingerie,isolated,white-background" },
  { key: "tights", label: "Bas", image: "https://source.unsplash.com/featured/600x800?tights,isolated,white-background" },
];

export default function CategoryPlaceholders() {
  return (
    <section className="mt-2">
      <div className="mb-4">
        <h2 className="text-xl font-serif text-neutral-900">Catégories (non portés)</h2>
        <p className="text-sm text-neutral-500">Aperçus d’articles non portés pour votre dressing</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((cat) => (
          <Card key={cat.key} className="overflow-hidden group">
            <div className="relative aspect-[3/4] bg-neutral-100">
              <img
                src={cat.image}
                alt={`${cat.label} non porté`}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="24">Image indisponible</text></svg>';
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white text-sm font-medium">{cat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}