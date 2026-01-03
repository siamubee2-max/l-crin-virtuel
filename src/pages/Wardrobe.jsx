import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Camera, Loader2, User as UserIcon, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from '@/components/LanguageProvider';
import WardrobeAIAssistant from '@/components/wardrobe/WardrobeAIAssistant';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Wardrobe() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form State
  const [newPart, setNewPart] = useState({
    name: "",
    type: "face",
    image_url: ""
  });

  const BODY_TYPES = [
    { value: "face", label: t.wardrobe.types.face, icon: "👤" },
    { value: "neck", label: t.wardrobe.types.neck, icon: "🧣" },
    { value: "bust_with_hands", label: t.wardrobe.types.bust_with_hands, icon: "💃" },
    { value: "left_ear_profile", label: t.wardrobe.types.left_ear_profile, icon: "👂" },
    { value: "right_ear_profile", label: t.wardrobe.types.right_ear_profile, icon: "👂" },
    { value: "left_wrist", label: t.wardrobe.types.left_wrist, icon: "⌚" },
    { value: "right_wrist", label: t.wardrobe.types.right_wrist, icon: "⌚" },
    { value: "left_hand", label: t.wardrobe.types.left_hand, icon: "✋" },
    { value: "right_hand", label: t.wardrobe.types.right_hand, icon: "✋" },
    { value: "left_ankle", label: t.wardrobe.types.left_ankle, icon: "🦶" },
    { value: "right_ankle", label: t.wardrobe.types.right_ankle, icon: "🦶" },
    { value: "full_body", label: t.wardrobe.types.full_body || "Corps Entier", icon: "🧍" },
    ];

  const { data: bodyParts, isLoading } = useQuery({
    queryKey: ['bodyParts'],
    queryFn: () => base44.entities.BodyPart.list(),
  });

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me().catch(() => null) });
  const { data: subscriptions } = useQuery({
    queryKey: ['userSubscription', user?.email],
    queryFn: () => base44.entities.UserSubscription.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });
  const isPremium = subscriptions?.some(s => s.status === 'active');
  const isLimitReached = !isPremium && bodyParts?.length >= 2;

  // Fetch clothing items for AI assistant
  const { data: clothingItems } = useQuery({
    queryKey: ['clothingItems'],
    queryFn: () => base44.entities.ClothingItem.list(),
  });

  // Fetch jewelry items for AI assistant
  const { data: jewelryItems } = useQuery({
    queryKey: ['jewelryItems'],
    queryFn: () => base44.entities.JewelryItem.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BodyPart.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyParts'] });
      setIsDialogOpen(false);
      setNewPart({ name: "", type: "face", image_url: "" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BodyPart.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyParts'] });
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setNewPart(prev => ({ ...prev, image_url: result.file_url }));
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!newPart.name || !newPart.image_url) return;
    createMutation.mutate(newPart);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-neutral-900 mb-2">{t.wardrobe.title}</h1>
          <p className="text-neutral-500 max-w-lg">
            {t.wardrobe.subtitle}
          </p>
        </div>

        <div className="flex gap-3">
          <WardrobeAIAssistant 
            clothingItems={clothingItems || []} 
            jewelryItems={jewelryItems || []} 
          />
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (open && isLimitReached) {
              if (window.confirm("La version gratuite est limitée à 2 photos. Passez Premium pour une garde-robe illimitée !")) {
                navigate(createPageUrl("Subscription"));
              }
              return;
            }
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-6">
                {isLimitReached ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} 
                {t.wardrobe.addPhoto}
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">{t.wardrobe.newPhoto}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>{t.wardrobe.nameLabel}</Label>
                <Input 
                  placeholder={t.wardrobe.namePlaceholder}
                  value={newPart.name}
                  onChange={(e) => setNewPart(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>{t.wardrobe.typeLabel}</Label>
                <Select 
                  value={newPart.type}
                  onValueChange={(val) => setNewPart(prev => ({ ...prev, type: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.wardrobe.photoLabel}</Label>
                <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center hover:bg-neutral-50 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center text-neutral-400">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <span className="text-sm">{t.common.upload}</span>
                    </div>
                  ) : newPart.image_url ? (
                    <div className="relative h-32 w-full">
                      <img 
                        src={newPart.image_url} 
                        alt="Preview" 
                        className="h-full w-full object-contain rounded-md"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-md text-white font-medium">
                        {t.common.change}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-neutral-400">
                      <Camera className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">{t.common.clickToUpload}</span>
                      <span className="text-xs mt-1">{t.common.orTakePhoto}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                disabled={!newPart.name || !newPart.image_url || createMutation.isPending}
              >
                {createMutation.isPending ? t.common.saving : t.common.save}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-neutral-300 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bodyParts?.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-neutral-200">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                <UserIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900">{t.wardrobe.emptyTitle}</h3>
              <p className="text-neutral-500 mt-2">{t.wardrobe.emptyText}</p>
            </div>
          ) : (
            bodyParts?.map((part) => (
              <motion.div
                key={part.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-neutral-100"
              >
                <div className="aspect-[3/4] bg-neutral-100 relative overflow-hidden">
                  <img 
                    src={part.image_url} 
                    alt={part.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteMutation.mutate(part.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent pt-12">

                    <p className="text-white/80 text-xs uppercase tracking-wider">
                      {BODY_TYPES.find(t => t.value === part.type)?.label || part.type}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}