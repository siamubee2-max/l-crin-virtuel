import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export default function SaveLookDialog({ 
  open, 
  onOpenChange, 
  creation,
  mainJewelry,
  bodyPart,
  suggestedComplementary = [],
  aiRecommendations = null
}) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    occasion: '',
    style_tags: [],
    complementary_jewelry_ids: suggestedComplementary.map(j => j.id)
  });
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.Look.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['looks'] });
      setSaved(true);
      setTimeout(() => {
        onOpenChange(false);
        setSaved(false);
        setFormData({
          title: '',
          description: '',
          occasion: '',
          style_tags: [],
          complementary_jewelry_ids: suggestedComplementary.map(j => j.id)
        });
      }, 1500);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      title: formData.title || `Look ${new Date().toLocaleDateString()}`,
      description: formData.description,
      main_creation_id: creation.id,
      main_jewelry_id: mainJewelry?.id,
      body_part_id: bodyPart?.id,
      complementary_jewelry_ids: formData.complementary_jewelry_ids,
      occasion: formData.occasion,
      style_tags: formData.style_tags,
      color_palette: aiRecommendations?.color_palette || [],
      is_public: false
    });
  };

  const toggleComplementary = (jewelryId) => {
    setFormData(prev => ({
      ...prev,
      complementary_jewelry_ids: prev.complementary_jewelry_ids.includes(jewelryId)
        ? prev.complementary_jewelry_ids.filter(id => id !== jewelryId)
        : [...prev.complementary_jewelry_ids, jewelryId]
    }));
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      style_tags: prev.style_tags.includes(tag)
        ? prev.style_tags.filter(t => t !== tag)
        : [...prev.style_tags, tag]
    }));
  };

  const suggestedTags = [
    'Élégant', 'Bohème', 'Minimaliste', 'Glamour', 'Vintage', 
    'Moderne', 'Romantique', 'Rock', 'Chic', 'Casual'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {saved ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-serif text-neutral-900 mb-2">Look sauvegardé !</h3>
            <p className="text-neutral-600">Retrouvez-le dans "Mes Looks"</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-600" />
                Sauvegarder comme Look
              </DialogTitle>
              <DialogDescription>
                Créez un look complet avec vos bijoux préférés
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Preview */}
              <div className="flex gap-4">
                <div className="w-32 h-32 rounded-lg overflow-hidden border border-neutral-200 shrink-0">
                  <img 
                    src={creation.result_image_url} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-neutral-500 mb-1">Bijou principal</p>
                  <p className="font-medium text-neutral-900">{mainJewelry?.name || 'Sans nom'}</p>
                  {bodyPart && (
                    <p className="text-sm text-neutral-500 mt-2">Sur : {bodyPart.name}</p>
                  )}
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Titre du look *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Look Soirée Élégante"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez votre style et l'occasion..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Occasion
                  </label>
                  <Input
                    value={formData.occasion}
                    onChange={(e) => setFormData(prev => ({ ...prev, occasion: e.target.value }))}
                    placeholder="Ex: Mariage, Soirée, Quotidien..."
                  />
                </div>

                {/* Style Tags */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tags de style
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={formData.style_tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Complementary Items */}
                {suggestedComplementary.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Pièces complémentaires ({formData.complementary_jewelry_ids.length} sélectionnées)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {suggestedComplementary.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => toggleComplementary(item.id)}
                          className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                            formData.complementary_jewelry_ids.includes(item.id)
                              ? 'border-amber-500 ring-2 ring-amber-200'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className="aspect-square">
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs p-2 text-center truncate">{item.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  disabled={saveMutation.isPending}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-purple-600"
                  disabled={saveMutation.isPending || !formData.title.trim()}
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}