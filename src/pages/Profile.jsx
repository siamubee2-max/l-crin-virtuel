import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Heart, Clock, Save, Gem, Bookmark } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from '@/components/LanguageProvider';
import StyleProfileEditor from '@/components/profile/StyleProfileEditor';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Profile() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // User Data State
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    bio: "",
    style_preferences: {
      favorite_colors: [],
      favorite_jewelry_types: [],
      frequent_occasions: []
    }
  });

  // Constants for preferences
  const COLORS = ["Or / Gold", "Argent / Silver", "Or Rose / Rose Gold", "Noir / Black", "Coloré / Colorful"];
  const TYPES = ["Colliers", "Boucles d'oreilles", "Bagues", "Bracelets", "Parures"];
  const OCCASIONS = ["Quotidien", "Travail", "Soirée", "Mariage", "Vacances"];

  // Fetch Current User
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      // If user has no style_preferences init, ensure structure
      if (!userData.style_preferences) {
        userData.style_preferences = {
          favorite_colors: [],
          favorite_jewelry_types: [],
          frequent_occasions: []
        };
      }
      return userData;
    },
  });

  // Fetch User Creations
  const { data: creations, isLoading: creationsLoading } = useQuery({
    queryKey: ['myCreations'],
    queryFn: () => base44.entities.Creation.list('-created_date', 20), // Last 20 creations
  });

  // Fetch Wishlist
  const { data: wishlistItems } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: async () => {
       const userEmail = user?.email; // Assuming we can filter by creator implicitly or explicit
       // Note: Standard list() returns items created by user if RLS is on, or all. 
       // We'll filter client side if needed or assume backend handles 'my data'.
       // Best practice with base44: .list() usually returns what user has access to.
       // If we want to be safe we can use .filter({ created_by: user.email }) if we had the email.
       // But usually for simple apps, list() is fine.
       const items = await base44.entities.WishlistItem.list();
       return items; 
    }
  });

  // Fetch all jewelry to map wishlist items (optimized: fetch all and filter client side for small catalogs)
  const { data: allJewelry } = useQuery({
     queryKey: ['allJewelry'],
     queryFn: () => base44.entities.JewelryItem.list()
  });

  const myWishlistJewelry = allJewelry?.filter(j => 
     wishlistItems?.some(w => w.jewelry_item_id === j.id)
  ) || [];

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        bio: user.bio || "",
        style_preferences: {
          favorite_colors: user.style_preferences?.favorite_colors || [],
          favorite_jewelry_types: user.style_preferences?.favorite_jewelry_types || [],
          frequent_occasions: user.style_preferences?.frequent_occasions || [],
          // New fields
          aesthetics: user.style_preferences?.aesthetics || [],
          jewelry_preference_type: user.style_preferences?.jewelry_preference_type || "mix",
          preferred_metals: user.style_preferences?.preferred_metals || [],
          preferred_gemstone_cuts: user.style_preferences?.preferred_gemstone_cuts || [],
          inspiration_images: user.style_preferences?.inspiration_images || []
        }
      });
    }
  }, [user]);

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsSaving(false);
      // Optional: Show success toast/message
    },
    onError: () => setIsSaving(false)
  });

  const handleSave = () => {
    setIsSaving(true);
    // Don't send email as it might not be editable depending on auth provider, 
    // but base44.auth.updateMe usually handles allowed fields. 
    // We'll try to update bio and preferences. 
    // full_name is usually updatable.
    updateMutation.mutate({
      full_name: formData.full_name,
      bio: formData.bio,
      style_preferences: formData.style_preferences
    });
  };

  const togglePreference = (category, value) => {
    setFormData(prev => {
      const currentList = prev.style_preferences[category] || [];
      const newList = currentList.includes(value)
        ? currentList.filter(item => item !== value)
        : [...currentList, value];
      
      return {
        ...prev,
        style_preferences: {
          ...prev.style_preferences,
          [category]: newList
        }
      };
    });
  };

  if (userLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-neutral-300" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-neutral-900 mb-2">{t.profile.title}</h1>
        <p className="text-neutral-500">{t.profile.subtitle}</p>
      </div>

      <Tabs defaultValue="info" className="space-y-8">
        <TabsList className="bg-white border border-neutral-100 p-1 rounded-xl">
          <TabsTrigger value="info" className="rounded-lg data-[state=active]:bg-neutral-900 data-[state=active]:text-white">
            <User className="w-4 h-4 mr-2" /> {t.profile.personalInfo}
          </TabsTrigger>
          <TabsTrigger value="style" className="rounded-lg data-[state=active]:bg-neutral-900 data-[state=active]:text-white">
            <Heart className="w-4 h-4 mr-2" /> {t.profile.stylePrefs}
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-neutral-900 data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" /> {t.profile.history}
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="rounded-lg data-[state=active]:bg-neutral-900 data-[state=active]:text-white">
            <Bookmark className="w-4 h-4 mr-2" /> {t.profile.wishlist || "Wishlist"}
          </TabsTrigger>
          </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="info">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6"
          >
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 mb-4 flex items-center gap-3">
               <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-neutral-500" />
               </div>
               <div>
                  <p className="font-medium text-neutral-900">Fashionista Anonyme</p>
                  <p className="text-xs text-neutral-500">Identité protégée</p>
               </div>
            </div>

            <div className="space-y-2">
              <Label>{t.profile.bio}</Label>
              <Textarea 
                placeholder={t.profile.bioPlaceholder}
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="h-32"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-neutral-900 hover:bg-neutral-800 text-white min-w-[150px]"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {updateMutation.isSuccess && !isSaving ? t.profile.saved : t.profile.save}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* Style Preferences Tab */}
        <TabsContent value="style">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm"
          >
             <StyleProfileEditor 
               preferences={formData.style_preferences}
               onChange={(newPrefs) => setFormData({...formData, style_preferences: newPrefs})}
               onSave={handleSave}
               isSaving={isSaving}
             />
          </motion.div>
        </TabsContent>

        {/* Wishlist Tab */}
        <TabsContent value="wishlist">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {myWishlistJewelry.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-neutral-200 text-center">
                <Heart className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                <p className="text-neutral-500">{t.profile.emptyWishlist || "Your wishlist is empty."}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                 {myWishlistJewelry.map(item => (
                   <div key={item.id} className="bg-white rounded-xl border border-neutral-100 overflow-hidden group hover:shadow-lg transition-all">
                      <div className="aspect-square bg-neutral-50 relative overflow-hidden">
                         <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                         <div className="absolute top-2 right-2">
                            <Button
                              size="icon"
                              variant="destructive" 
                              className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={async () => {
                                 const wishlistItem = wishlistItems.find(w => w.jewelry_item_id === item.id);
                                 if (wishlistItem) {
                                    await base44.entities.WishlistItem.delete(wishlistItem.id);
                                    queryClient.invalidateQueries({ queryKey: ['myWishlist'] });
                                 }
                              }}
                            >
                              <Heart className="w-4 h-4 fill-white" />
                            </Button>
                         </div>
                      </div>
                      <div className="p-4">
                       <h3 className="font-medium text-neutral-900 truncate">{item.name}</h3>
                       <p className="text-xs text-neutral-500">{item.brand || item.type}</p>
                       <Link to={createPageUrl("JewelryBox") + `?item=${item.id}`}>
                         <Button variant="outline" size="sm" className="w-full mt-3 text-xs">
                            View Item
                         </Button>
                       </Link>
                      </div>
                      </div>
                      ))}
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {creationsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-neutral-300" /></div>
            ) : creations?.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-neutral-200 text-center">
                <Gem className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                <p className="text-neutral-500">{t.profile.noCreations}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {creations.map((creation) => (
                  <div key={creation.id} className="group relative aspect-[3/4] bg-neutral-100 rounded-xl overflow-hidden cursor-pointer" onClick={() => window.open(creation.result_image_url, '_blank')}>
                    <img src={creation.result_image_url} alt="Creation" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <p className="text-white text-xs font-medium truncate">{new Date(creation.created_date).toLocaleDateString()}</p>
                      <p className="text-white/80 text-[10px] capitalize">{creation.jewelry_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}