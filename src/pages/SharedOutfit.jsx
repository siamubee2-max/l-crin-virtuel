import React, { useMemo } from 'react';
import SEO from '@/components/common/SEO';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

function decodePayload() {
  try {
    const params = new URLSearchParams(window.location.search);
    const d = params.get('d');
    if (!d) return null;
    const json = decodeURIComponent(escape(atob(d)));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export default function SharedOutfit() {
  const data = useMemo(() => decodePayload(), []);

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <SEO title="Tenue partagée" />
        <Sparkles className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <p className="text-neutral-500">Lien invalide ou données manquantes.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <SEO title={data.title || 'Tenue partagée'} description={data.user_comment || data.description} />

      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-purple-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <h1 className="text-2xl font-serif text-neutral-900">{data.title || 'Tenue partagée'}</h1>
        </div>
        {(data.tags?.length || 0) > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {data.tags.slice(0, 10).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
        {data.user_comment && (
          <p className="text-neutral-700">{data.user_comment}</p>
        )}
        {!data.user_comment && data.description && (
          <p className="text-neutral-600">{data.description}</p>
        )}
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(data.items || []).map((it, idx) => (
          <Card key={idx} className="overflow-hidden">
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
  );
}