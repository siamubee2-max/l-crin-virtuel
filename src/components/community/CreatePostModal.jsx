import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UploadCloud, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function CreatePostModal({ isOpen, onClose, currentUser }) {
  const [content, setContent] = useState("");
  const [type, setType] = useState("showcase");
  const [category, setCategory] = useState("jewelry");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const createPostMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = null;

      if (imageFile) {
        setIsUploading(true);
        try {
          const uploadRes = await base44.integrations.Core.UploadFile({
            file: imageFile
          });
          imageUrl = uploadRes.file_url;
        } catch (error) {
          console.error("Upload failed", error);
        } finally {
          setIsUploading(false);
        }
      }

      return base44.entities.CommunityPost.create({
        content,
        type,
        category,
        image_url: imageUrl,
        user_display_name: currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Membre',
        user_avatar: currentUser?.profile_image,
        likes_count: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communityPosts']);
      onClose();
      setContent("");
      setImageFile(null);
      setPreviewUrl(null);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un post</DialogTitle>
          <DialogDescription>
            Partagez vos astuces, vos créations ou posez une question à la communauté.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de post</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="showcase">✨ Essayage</SelectItem>
                  <SelectItem value="tip">💡 Astuce</SelectItem>
                  <SelectItem value="recommendation">⭐ Recommandation</SelectItem>
                  <SelectItem value="question">❓ Question</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jewelry">Bijoux</SelectItem>
                  <SelectItem value="clothing">Vêtements</SelectItem>
                  <SelectItem value="both">Mode & Bijoux</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Votre message</Label>
            <Textarea 
              placeholder="Racontez-nous tout..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Photo (optionnel)</Label>
            <div 
              className="border-2 border-dashed border-neutral-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors relative"
              onClick={() => document.getElementById('post-image-upload').click()}
            >
              {previewUrl ? (
                <div className="relative w-full h-48">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                    <span className="text-white text-sm font-medium">Changer l'image</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-2 text-neutral-500">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-neutral-500 text-center">
                    Cliquez pour ajouter une photo de votre essayage ou inspiration
                  </p>
                </>
              )}
              <input 
                id="post-image-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button 
            onClick={() => createPostMutation.mutate()} 
            disabled={!content.trim() || createPostMutation.isPending || isUploading}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {(createPostMutation.isPending || isUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Publier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}