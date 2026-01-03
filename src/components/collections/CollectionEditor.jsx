import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Lock, Link as LinkIcon, Copy, Check, Sparkles, Loader2 } from "lucide-react";

// Tag input component
export function TagInput({ tags = [], onChange, suggestions = [] }) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag) => {
    const normalized = tag.trim().toLowerCase();
    if (normalized && !tags.includes(normalized)) {
      onChange([...tags, normalized]);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, idx) => (
          <Badge key={idx} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ajouter un tag (Entrée pour valider)"
          className="pr-10"
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          onClick={() => addTag(inputValue)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {inputValue && filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {filteredSuggestions.slice(0, 5).map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => addTag(suggestion)}
              className="text-xs bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded transition-colors"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Privacy settings component
export function PrivacySettings({ isPrivate, shareToken, onTogglePrivate, onGenerateToken }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = shareToken 
    ? `${window.location.origin}/ShopTheLook?token=${shareToken}` 
    : null;

  const copyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="w-4 h-4" /> Confidentialité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Collection Privée</p>
            <p className="text-xs text-neutral-500">Non visible publiquement</p>
          </div>
          <Switch checked={isPrivate} onCheckedChange={onTogglePrivate} />
        </div>

        {isPrivate && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-neutral-400" />
              <span className="text-sm font-medium">Lien de Partage</span>
            </div>
            
            {shareToken ? (
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="text-xs bg-neutral-50" />
                <Button size="sm" variant="outline" onClick={copyLink}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={onGenerateToken} className="w-full">
                Générer un lien de partage
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Product suggestions component
export function ProductSuggestions({ currentItems = [], jewelryItems = [], clothingItems = [], onAddItem }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const generateSuggestions = async () => {
    setLoading(true);
    
    const currentItemDetails = currentItems.map(item => {
      if (item.item_type === 'jewelry') {
        const found = jewelryItems.find(j => j.id === item.item_id);
        return found ? `${found.name} (${found.type}, ${found.material || ''})` : null;
      } else {
        const found = clothingItems.find(c => c.id === item.item_id);
        return found ? `${found.name} (${found.type}, ${found.color || ''})` : null;
      }
    }).filter(Boolean);

    if (currentItemDetails.length === 0) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const allItems = [
      ...jewelryItems.map(j => ({ ...j, itemType: 'jewelry' })),
      ...clothingItems.map(c => ({ ...c, itemType: 'clothing' }))
    ].filter(item => !currentItems.some(ci => ci.item_id === item.id));

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un styliste expert. Voici les articles déjà dans une collection:
${currentItemDetails.join('\n')}

Voici les articles disponibles:
${allItems.slice(0, 30).map(i => `- ${i.id}: ${i.name} (${i.itemType}, ${i.type || ''}, ${i.material || i.color || ''})`).join('\n')}

Suggère les 4 meilleurs articles complémentaires parmi la liste disponible. Retourne uniquement les IDs des articles suggérés avec une courte raison.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (response?.suggestions) {
        const enriched = response.suggestions.map(s => {
          const item = allItems.find(i => i.id === s.id);
          return item ? { ...item, reason: s.reason } : null;
        }).filter(Boolean);
        setSuggestions(enriched);
      }
    } catch (err) {
      console.error('Suggestion error:', err);
      // Fallback: suggest random complementary items
      const fallback = allItems.slice(0, 4);
      setSuggestions(fallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Suggestions IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={generateSuggestions} 
          disabled={loading || currentItems.length === 0}
          variant="outline"
          className="w-full"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyse en cours...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Suggérer des produits complémentaires</>
          )}
        </Button>

        {currentItems.length === 0 && (
          <p className="text-xs text-neutral-500 text-center">
            Ajoutez d'abord des articles à votre collection
          </p>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-neutral-500 font-medium">Articles suggérés :</p>
            <div className="grid gap-2">
              {suggestions.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-neutral-50 rounded-lg">
                  <div className="w-12 h-12 rounded bg-white overflow-hidden flex-shrink-0">
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{item.reason}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onAddItem({ item_id: item.id, item_type: item.itemType })}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Common tag suggestions
export const COMMON_TAGS = [
  'luxe', 'casual', 'soirée', 'mariage', 'bureau', 'été', 'hiver', 
  'vintage', 'moderne', 'minimaliste', 'bohème', 'chic', 'streetwear',
  'or', 'argent', 'diamant', 'perle', 'coloré', 'noir', 'blanc',
  'romantique', 'audacieux', 'classique', 'tendance', 'intemporel'
];

// Generate share token
export function generateShareToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}