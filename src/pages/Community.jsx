import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Users, Plus, Filter, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEO from '@/components/common/SEO';
import PostCard from '@/components/community/PostCard';
import CreatePostModal from '@/components/community/CreatePostModal';
import { motion } from 'framer-motion';

export default function Community() {
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  // Fetch posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['communityPosts', activeTab],
    queryFn: async () => {
      if (activeTab === 'all') {
        return base44.entities.CommunityPost.list('-created_date', 50);
      } else {
        return base44.entities.CommunityPost.filter({ type: activeTab }, '-created_date', 50);
      }
    }
  });

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <SEO 
        title="Communauté - L'Écrin Virtuel" 
        description="Rejoignez la communauté de L'Écrin Virtuel. Partagez vos essayages, découvrez des astuces mode et échangez avec d'autres passionnés."
      />

      {/* Hero Header */}
      <div className="bg-white border-b border-neutral-100 py-12 px-4 mb-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-6">
            <Users className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-4xl font-serif text-neutral-900 mb-4">La Communauté</h1>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto mb-8">
            L'espace d'échange pour les passionnés de mode et de bijoux. Partagez vos looks, donnez vos avis et trouvez l'inspiration.
          </p>
          
          <Button 
            size="lg" 
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-8 shadow-lg shadow-amber-200/50"
            onClick={() => {
              if (currentUser) {
                setIsCreateModalOpen(true);
              } else {
                base44.auth.redirectToLogin();
              }
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Partager quelque chose
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-neutral-200 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="all">Tout</TabsTrigger>
            <TabsTrigger value="showcase">Essayages</TabsTrigger>
            <TabsTrigger value="tip">Astuces</TabsTrigger>
            <TabsTrigger value="question">Questions</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-neutral-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map((post, idx) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <PostCard post={post} currentUser={currentUser} />
                </motion.div>
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-neutral-200">
                <Sparkles className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">C'est un peu calme ici...</h3>
                <p className="text-neutral-500 mb-6">Soyez le premier à partager votre style avec la communauté !</p>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
                  Créer le premier post
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        currentUser={currentUser}
      />
    </div>
  );
}