import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Wand2, Sparkles } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { key: 'top', label: 'Haut' },
  { key: 'bottom', label: 'Bas' },
  { key: 'dress', label: 'Robe' },
  { key: 'outerwear', label: 'Veste/Manteau' },
  { key: 'shoes', label: 'Chaussures' },
  { key: 'bag', label: 'Sac' },
  { key: 'accessory', label: 'Accessoire' },
];

export default function OutfitGenerator({ clothingItems = [] }) {
  const [selected, setSelected] = useState(['top', 'bottom', 'shoes']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const itemsByType = useMemo(() => {
    const map = Object.fromEntries(CATEGORY_OPTIONS.map(c => [c.key, []]));
    clothingItems.forEach(item => {
      if (map[item.type]) map[item.type].push(item);
    });
    return map;
  }, [clothingItems]);

  const canGenerate = selected.length > 0 && selected.some(cat => (itemsByType[cat] || []).length > 0);

  const handleToggle = (key) => {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const buildAvailableItemsSummary = () => {
    const summary = selected.reduce((acc, cat) => {
      const items = (itemsByType[cat] || []).map(it => ({
        id: it.id,
        name: it.name,
        brand: it.brand || null,
        color: it.color || null,
        material: it.material || null,
        price: it.price || null,
        tags: it.tags || [],
        type: it.type,
      }));
      acc[cat] = items;
      return acc;
    }, {});
    return JSON.stringify(summary, null, 2);
  };

  const generateOutfit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const categories = selected;
      const availableJSON = buildAvailableItemsSummary();
      const schema = {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          style_tags: { type: 'array', items: { type: 'string' } },
          selected_items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string', enum: CATEGORY_OPTIONS.map(c => c.key) },
                item_id: { type: 'string' }
              },
              required: ['category', 'item_id']
            }
          }
        },
        required: ['selected_items']
      };

      const prompt = `Tu es un styliste de mode. Génère une tenue cohérente et portable en utilisant UNIQUEMENT des articles disponibles dans le dressing (ci-dessous) et limité aux catégories choisies. 

Catégories choisies: ${categories.join(', ')}

Articles disponibles (JSON par catégorie):\n${availableJSON}\n
Contraintes:
- Choisis au plus un article par catégorie sélectionnée
- Privilégie l'harmonie des couleurs, des matières et de l'occasion polyvalente (quotidien chic)
- Si une catégorie ne contient aucun article, ne la renvoie pas
- Ne crée pas d'articles qui n'existent pas

Retourne un JSON strictement conforme au schéma fourni.`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: schema,
        add_context_from_internet: false,
      });

      // Map back to real items
      const picked = (res.selected_items || []).map(sel => {
        const list = itemsByType[sel.category] || [];
        const found = list.find(it => String(it.id) === String(sel.item_id));
        return found ? { ...found, category: sel.category } : null;
      }).filter(Boolean);

      setResult({
        title: res.title || 'Tenue générée',
        description: res.description || '',
        style_tags: res.style_tags || [],
        items: picked,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-purple-100 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-amber-600" />
        </div>
        <h2 className="text-xl font-serif text-neutral-900">Générer une tenue</h2>
      </div>
      <p className="text-sm text-neutral-500 mb-4">Sélectionnez les catégories à inclure, puis générez une proposition basée sur votre dressing.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
        {CATEGORY_OPTIONS.map(opt => (
          <label key={opt.key} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-neutral-50 cursor-pointer">
            <Checkbox checked={selected.includes(opt.key)} onCheckedChange={() => handleToggle(opt.key)} />
            <span className="text-sm">{opt.label}</span>
            <span className="ml-auto text-xs text-neutral-400">{(itemsByType[opt.key] || []).length}</span>
          </label>
        ))}
      </div>

      <Button onClick={generateOutfit} disabled={!canGenerate || loading} className="mb-6">
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
        {loading ? 'Génération...' : 'Générer une tenue'}
      </Button>

      {result && (
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-medium">{result.title}</h3>
            {result.style_tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {result.style_tags.slice(0,6).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
            {result.description && <p className="text-sm text-neutral-600 mt-2">{result.description}</p>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {result.items.map((it) => (
              <Card key={it.id} className="overflow-hidden">
                <div className="relative aspect-[3/4] bg-neutral-100">
                  {it.image_url ? (
                    <img
                      src={it.image_url}
                      alt={it.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"900\" height=\"1200\"><rect width=\"100%\" height=\"100%\" fill=\"%23f3f4f6\"/><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"%239ca3af\" font-size=\"24\">Image indisponible</text></svg>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">Aperçu indisponible</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex items-center justify-between text-white">
                      <span className="text-sm font-medium truncate">{it.name}</span>
                      <span className="text-[10px] uppercase tracking-wider opacity-80">{it.type}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}