import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Camera, Loader2, Upload } from "lucide-react";
import { motion } from "framer-motion";

const BODY_TYPES = [
  { value: "face", label: "Visage (Face)", icon: "👤" },
  { value: "neck", label: "Cou & Décolleté", icon: "🧣" },
  { value: "bust_with_hands", label: "Buste avec Mains (Parure complète)", icon: "💃" },
  { value: "left_ear_profile", label: "Oreille Gauche", icon: "👂" },
  { value: "right_ear_profile", label: "Oreille Droite", icon: "👂" },
  { value: "left_wrist", label: "Poignet Gauche", icon: "⌚" },
  { value: "right_wrist", label: "Poignet Droit", icon: "⌚" },
  { value: "left_hand", label: "Main Gauche", icon: "✋" },
  { value: "right_hand", label: "Main Droite", icon: "✋" },
  { value: "left_ankle", label: "Cheville Gauche", icon: "🦶" },
  { value: "right_ankle", label: "Cheville Droite", icon: "🦶" },
];

export default function Wardrobe() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form State
  const [newPart, setNewPart] = useState({
    name: "",
    type: "face",
    image_url: ""
  });

  const { data: bodyParts, isLoading } = useQuery({
    queryKey: ['bodyParts'],
    queryFn: () => base44.entities.BodyPart.list(),
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
          <h1 className="text-3xl font-serif text-neutral-900 mb-2">Ma Bibliothèque</h1>
          <p className="text-neutral-500 max-w-lg">
            Gérez votre collection de parties du corps pour vos essayages virtuels. 
            Prenez des photos claires et bien éclairées.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-6">
              <Plus className="w-4 h-4 mr-2" /> Ajouter une photo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Nouvelle photo</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Nom (ex: Mon profil droit)</Label>
                <Input 
                  placeholder="Nom de la photo..." 
                  value={newPart.name}
                  onChange={(e) => setNewPart(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Partie du corps</Label>
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
                <Label>Photo</Label>
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
                      <span className="text-sm">Téléchargement...</span>
                    </div>
                  ) : newPart.image_url ? (
                    <div className="relative h-32 w-full">
                      <img 
                        src={newPart.image_url} 
                        alt="Preview" 
                        className="h-full w-full object-contain rounded-md"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-md text-white font-medium">
                        Changer
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-neutral-400">
                      <Camera className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">Cliquez pour ajouter une photo</span>
                      <span className="text-xs mt-1">ou prenez-en une maintenant</span>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                disabled={!newPart.name || !newPart.image_url || createMutation.isPending}
              >
                {createMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900">Votre bibliothèque est vide</h3>
              <p className="text-neutral-500 mt-2">Commencez par ajouter une photo de vous.</p>
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
                <div className="aspect-[4/5] bg-neutral-100 relative overflow-hidden">
                  <img 
                    src={part.image_url} 
                    alt={part.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                    <p className="text-white font-medium">{part.name}</p>
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