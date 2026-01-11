import React, { useState } from 'react';
import { base44 } from '@/api/apiClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Camera, 
  DollarSign, TrendingUp, Users, Heart, ShoppingBag, Lightbulb,
  Instagram, Youtube, Globe, Star, Bookmark, Eye, AlertCircle, X, ImagePlus, Info, Edit2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const STEPS = {
  WELCOME: 0,
  PROFILE_IMAGES: 1,
  PROFILE_INFO: 2,
  SPECIALTIES: 3,
  COMMISSIONS: 4,
  BEST_PRACTICES: 5,
  REVIEW: 6,
  SUCCESS: 7
};

export default function CreatorOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.WELCOME);
  const [uploading, setUploading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    profile_image: '',
    cover_image: '',
    portfolio_images: [],
    specialties: [],
    social_links: {
      instagram: '',
      tiktok: '',
      youtube: '',
      website: ''
    }
  });

  const [validationErrors, setValidationErrors] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: existingProfile } = useQuery({
    queryKey: ['myCreatorProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.CreatorProfile.filter({ user_id: user?.id });
      return profiles[0];
    },
    enabled: !!user?.id
  });

  const submitApplication = useMutation({
    mutationFn: () => base44.entities.CreatorProfile.create({
      ...formData,
      user_id: user?.id,
      status: 'pending',
      commission_rate: 10,
      total_earnings: 0,
      follower_count: 0,
      verified: false
    }),
    onSuccess: () => setStep(STEPS.SUCCESS)
  });

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, [field]: result.file_url }));
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setUploading(false);
    }
  };

  const handlePortfolioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (formData.portfolio_images.length >= 6) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ 
        ...prev, 
        portfolio_images: [...prev.portfolio_images, result.file_url] 
      }));
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setUploading(false);
    }
  };

  const removePortfolioImage = (index) => {
    setFormData(prev => ({
      ...prev,
      portfolio_images: prev.portfolio_images.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (currentStep) => {
    const errors = {};
    
    if (currentStep === STEPS.PROFILE_IMAGES) {
      if (!formData.profile_image) {
        errors.profile_image = "Une photo de profil est requise";
      }
    }
    
    if (currentStep === STEPS.PROFILE_INFO) {
      if (!formData.display_name.trim()) {
        errors.display_name = "Un nom d'affichage est requis";
      }
      if (formData.display_name.length < 2) {
        errors.display_name = "Le nom doit contenir au moins 2 caractères";
      }
      if (!formData.bio.trim()) {
        errors.bio = "Une biographie est requise";
      }
      if (formData.bio.length < 50) {
        errors.bio = "La bio doit contenir au moins 50 caractères";
      }
    }
    
    if (currentStep === STEPS.SPECIALTIES) {
      if (formData.specialties.length === 0) {
        errors.specialties = "Sélectionnez au moins une spécialité";
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = (nextStep) => {
    if (validateStep(step)) {
      setStep(nextStep);
    }
  };

  const toggleSpecialty = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const specialtyOptions = [
    'Luxury', 'Streetwear', 'Vintage', 'Minimalist', 'Boho', 
    'Bridal', 'Casual', 'Evening', 'Sustainable', 'Avant-garde'
  ];

  const totalSteps = Object.keys(STEPS).length - 2; // Exclude WELCOME and SUCCESS
  const currentStepNum = step === STEPS.WELCOME ? 0 : step - 1;
  const progress = step === STEPS.SUCCESS ? 100 : (currentStepNum / totalSteps) * 100;

  const stepTitles = {
    [STEPS.PROFILE_IMAGES]: "Photos",
    [STEPS.PROFILE_INFO]: "Informations",
    [STEPS.SPECIALTIES]: "Spécialités",
    [STEPS.COMMISSIONS]: "Commissions",
    [STEPS.BEST_PRACTICES]: "Conseils",
    [STEPS.REVIEW]: "Validation"
  };

  // If already applied
  if (existingProfile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
          existingProfile.status === 'approved' ? 'bg-green-100' : 
          existingProfile.status === 'pending' ? 'bg-amber-100' : 'bg-red-100'
        }`}>
          {existingProfile.status === 'approved' ? (
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          ) : existingProfile.status === 'pending' ? (
            <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
          ) : (
            <Sparkles className="w-10 h-10 text-red-600" />
          )}
        </div>
        <h1 className="text-3xl font-serif mb-4">
          {existingProfile.status === 'approved' ? 'Welcome, Creator!' : 
           existingProfile.status === 'pending' ? 'Application Pending' : 'Application Status'}
        </h1>
        <p className="text-neutral-600 mb-8">
          {existingProfile.status === 'approved' 
            ? 'Your creator account is active. Start creating collections!' 
            : existingProfile.status === 'pending'
            ? 'Your application is being reviewed. We\'ll notify you soon.'
            : 'Your application needs attention. Please contact support.'}
        </p>
        {existingProfile.status === 'approved' && (
          <Button onClick={() => navigate(createPageUrl('CreatorDashboard'))}>
            Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar with Step Indicators */}
      {step > STEPS.WELCOME && step < STEPS.SUCCESS && (
        <div className="mb-8">
          <div className="flex justify-between text-sm text-neutral-500 mb-2">
            <span>Étape {currentStepNum} sur {totalSteps}</span>
            <span>{Math.round(progress)}% complété</span>
          </div>
          <Progress value={progress} className="h-2 mb-4" />
          
          {/* Step Indicator Pills */}
          <div className="flex justify-center gap-2 flex-wrap">
            {Object.entries(stepTitles).map(([stepKey, title]) => {
              const stepNum = parseInt(stepKey);
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              return (
                <div
                  key={stepKey}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isActive ? 'bg-neutral-900 text-white' :
                    isCompleted ? 'bg-green-100 text-green-700' :
                    'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  {isCompleted && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                  {title}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Welcome Step */}
        {step === STEPS.WELCOME && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-8 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-serif mb-4">Become a Creator</h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-lg mx-auto">
              Join our community of style experts. Curate collections, inspire others, and earn commissions.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="text-left">
                <CardContent className="pt-6">
                  <DollarSign className="w-8 h-8 text-green-600 mb-3" />
                  <h3 className="font-medium mb-1">Earn Commissions</h3>
                  <p className="text-sm text-neutral-500">Get 10% on every sale from your curated collections</p>
                </CardContent>
              </Card>
              <Card className="text-left">
                <CardContent className="pt-6">
                  <Users className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-medium mb-1">Build Your Audience</h3>
                  <p className="text-sm text-neutral-500">Grow your following with featured collections</p>
                </CardContent>
              </Card>
              <Card className="text-left">
                <CardContent className="pt-6">
                  <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
                  <h3 className="font-medium mb-1">Track Performance</h3>
                  <p className="text-sm text-neutral-500">Analytics dashboard to optimize your content</p>
                </CardContent>
              </Card>
            </div>

            <Button size="lg" onClick={() => setStep(STEPS.PROFILE_IMAGES)} className="px-8">
              Commencer <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Step 1: Profile Images */}
        {step === STEPS.PROFILE_IMAGES && (
          <motion.div
            key="profile-images"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-serif mb-2">📸 Vos Photos</h2>
              <p className="text-neutral-500">Ajoutez une photo de profil et une couverture attrayante</p>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <Info className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                Une photo de profil professionnelle augmente de 40% les chances d'être suivi !
              </AlertDescription>
            </Alert>

            {/* Profile Image - Required */}
            <Card className={`${validationErrors.profile_image ? 'border-red-300 bg-red-50/50' : ''}`}>
              <CardContent className="pt-6">
                <Label className="mb-3 block">Photo de profil *</Label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className={`w-28 h-28 rounded-full border-4 ${formData.profile_image ? 'border-green-300' : 'border-dashed border-neutral-300'} bg-neutral-100 overflow-hidden relative`}>
                      {formData.profile_image ? (
                        <img src={formData.profile_image} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <Camera className="w-10 h-10" />
                        </div>
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="w-6 h-6 text-white" />
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile_image')} className="hidden" />
                      </label>
                    </div>
                    {formData.profile_image && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-neutral-600 mb-2">Choisissez une photo claire de votre visage</p>
                    <ul className="text-xs text-neutral-500 space-y-1">
                      <li>✓ Format carré recommandé</li>
                      <li>✓ Bonne luminosité</li>
                      <li>✓ Fond neutre de préférence</li>
                    </ul>
                  </div>
                </div>
                {validationErrors.profile_image && (
                  <p className="text-red-500 text-sm mt-3 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {validationErrors.profile_image}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Cover Image - Optional but recommended */}
            <Card>
              <CardContent className="pt-6">
                <Label className="mb-3 block">Image de couverture (recommandé)</Label>
                <div className="relative h-40 bg-gradient-to-r from-purple-200 to-pink-200 rounded-xl overflow-hidden">
                  {formData.cover_image ? (
                    <>
                      <img src={formData.cover_image} alt="Cover" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setFormData({...formData, cover_image: ''})}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer text-neutral-500 hover:text-neutral-700 transition-colors">
                      <ImagePlus className="w-10 h-10 mb-2" />
                      <span className="text-sm font-medium">Ajouter une couverture</span>
                      <span className="text-xs">1200x400px recommandé</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover_image')} className="hidden" />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Images */}
            <Card>
              <CardContent className="pt-6">
                <Label className="mb-3 block">Portfolio (jusqu'à 6 images)</Label>
                <p className="text-sm text-neutral-500 mb-4">Montrez vos meilleures créations ou looks pour illustrer votre style</p>
                
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {formData.portfolio_images.map((img, idx) => (
                    <div key={idx} className="aspect-square relative rounded-lg overflow-hidden group">
                      <img src={img} alt={`Portfolio ${idx+1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removePortfolioImage(idx)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  ))}
                  
                  {formData.portfolio_images.length < 6 && (
                    <label className="aspect-square border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-neutral-400 hover:bg-neutral-50 transition-all">
                      {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                      ) : (
                        <>
                          <ImagePlus className="w-6 h-6 text-neutral-400 mb-1" />
                          <span className="text-xs text-neutral-400">Ajouter</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handlePortfolioUpload} className="hidden" disabled={uploading} />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-6">
              <Button variant="ghost" onClick={() => setStep(STEPS.WELCOME)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour
              </Button>
              <Button onClick={() => handleNextStep(STEPS.PROFILE_INFO)} disabled={uploading}>
                Continuer <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Profile Info */}
        {step === STEPS.PROFILE_INFO && (
          <motion.div
            key="profile-info"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-serif mb-2">✍️ À Propos de Vous</h2>
              <p className="text-neutral-500">Présentez-vous à votre future audience</p>
            </div>

            <Card className={`${validationErrors.display_name ? 'border-red-300' : ''}`}>
              <CardContent className="pt-6 space-y-2">
                <Label>Nom d'affichage *</Label>
                <Input 
                  value={formData.display_name}
                  onChange={(e) => {
                    setFormData({...formData, display_name: e.target.value});
                    setValidationErrors({...validationErrors, display_name: null});
                  }}
                  placeholder="Ex: Marie Style, The Fashion Guy..."
                  className={validationErrors.display_name ? 'border-red-300' : ''}
                />
                <p className="text-xs text-neutral-500">Ce nom sera visible publiquement sur vos collections</p>
                {validationErrors.display_name && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {validationErrors.display_name}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className={`${validationErrors.bio ? 'border-red-300' : ''}`}>
              <CardContent className="pt-6 space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Biographie *</Label>
                  <span className={`text-xs ${formData.bio.length < 50 ? 'text-amber-600' : 'text-green-600'}`}>
                    {formData.bio.length}/50 min
                  </span>
                </div>
                <Textarea 
                  value={formData.bio}
                  onChange={(e) => {
                    setFormData({...formData, bio: e.target.value});
                    setValidationErrors({...validationErrors, bio: null});
                  }}
                  placeholder="Parlez de votre parcours mode, vos inspirations, ce qui vous rend unique..."
                  rows={5}
                  className={validationErrors.bio ? 'border-red-300' : ''}
                />
                <Alert className="bg-amber-50 border-amber-200">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 text-xs">
                    <strong>Conseils :</strong> Mentionnez votre expérience, vos marques préférées, et ce qui vous passionne dans la mode.
                  </AlertDescription>
                </Alert>
                {validationErrors.bio && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {validationErrors.bio}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <Label>Réseaux sociaux (optionnel)</Label>
                <p className="text-sm text-neutral-500">Connectez vos réseaux pour augmenter votre crédibilité</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-500 shrink-0" />
                    <Input 
                      value={formData.social_links.instagram}
                      onChange={(e) => setFormData({...formData, social_links: {...formData.social_links, instagram: e.target.value}})}
                      placeholder="@username"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center text-sm shrink-0">🎵</div>
                    <Input 
                      value={formData.social_links.tiktok}
                      onChange={(e) => setFormData({...formData, social_links: {...formData.social_links, tiktok: e.target.value}})}
                      placeholder="@username"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-500 shrink-0" />
                    <Input 
                      value={formData.social_links.youtube}
                      onChange={(e) => setFormData({...formData, social_links: {...formData.social_links, youtube: e.target.value}})}
                      placeholder="Nom de chaîne"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-neutral-500 shrink-0" />
                    <Input 
                      value={formData.social_links.website}
                      onChange={(e) => setFormData({...formData, social_links: {...formData.social_links, website: e.target.value}})}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-6">
              <Button variant="ghost" onClick={() => setStep(STEPS.PROFILE_IMAGES)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour
              </Button>
              <Button onClick={() => handleNextStep(STEPS.SPECIALTIES)}>
                Continuer <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Specialties */}
        {step === STEPS.SPECIALTIES && (
          <motion.div
            key="specialties"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-serif mb-2">🎨 Vos Spécialités</h2>
              <p className="text-neutral-500">Sélectionnez les styles qui vous définissent le mieux</p>
            </div>

            <Alert className="bg-purple-50 border-purple-200">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <AlertDescription className="text-purple-700">
                Choisissez au moins 1 spécialité. Cela aidera les utilisateurs à vous découvrir !
              </AlertDescription>
            </Alert>

            <Card className={`${validationErrors.specialties ? 'border-red-300' : ''}`}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {specialtyOptions.map(specialty => {
                    const isSelected = formData.specialties.includes(specialty);
                    return (
                      <button
                        key={specialty}
                        onClick={() => {
                          toggleSpecialty(specialty);
                          setValidationErrors({...validationErrors, specialties: null});
                        }}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-lg scale-105'
                            : 'bg-white hover:border-neutral-400 hover:shadow'
                        }`}
                      >
                        <span className="text-2xl block mb-1">
                          {specialty === 'Luxury' ? '💎' :
                           specialty === 'Streetwear' ? '🔥' :
                           specialty === 'Vintage' ? '🕰️' :
                           specialty === 'Minimalist' ? '⚪' :
                           specialty === 'Boho' ? '🌸' :
                           specialty === 'Bridal' ? '💍' :
                           specialty === 'Casual' ? '👕' :
                           specialty === 'Evening' ? '✨' :
                           specialty === 'Sustainable' ? '🌿' : '🎭'}
                        </span>
                        <span className="text-sm font-medium">{specialty}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 mx-auto mt-1" />}
                      </button>
                    );
                  })}
                </div>
                {validationErrors.specialties && (
                  <p className="text-red-500 text-sm mt-4 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {validationErrors.specialties}
                  </p>
                )}
                
                {formData.specialties.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-sm text-neutral-500 mb-2">Sélectionné ({formData.specialties.length}) :</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.specialties.map(s => (
                        <Badge key={s} className="bg-neutral-900 text-white">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between pt-6">
              <Button variant="ghost" onClick={() => setStep(STEPS.PROFILE_INFO)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour
              </Button>
              <Button onClick={() => handleNextStep(STEPS.COMMISSIONS)}>
                Continuer <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Commissions Step */}
        {step === STEPS.COMMISSIONS && (
          <motion.div
            key="commissions"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-serif mb-2">How You Earn</h2>
              <p className="text-neutral-500">Understanding your commission structure</p>
            </div>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-green-700">10%</h3>
                    <p className="text-green-600">Base Commission Rate</p>
                  </div>
                </div>
                <p className="text-neutral-600">
                  You earn 10% on every purchase made through your curated collections and affiliate links.
                </p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <ShoppingBag className="w-6 h-6 text-purple-600 mb-3" />
                  <h4 className="font-medium mb-2">Shop the Look Sales</h4>
                  <p className="text-sm text-neutral-500">When users purchase items from your curated collections, you earn commission on each item.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Heart className="w-6 h-6 text-red-500 mb-3" />
                  <h4 className="font-medium mb-2">Affiliate Links</h4>
                  <p className="text-sm text-neutral-500">Share your unique affiliate links on social media to earn on external purchases.</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5" /> Bonus Opportunities
              </h4>
              <ul className="space-y-2 text-sm text-amber-700">
                <li>• Featured creators can earn up to 15% commission</li>
                <li>• Monthly top performers receive bonus payouts</li>
                <li>• Exclusive brand partnership opportunities</li>
              </ul>
            </div>

            <div className="bg-neutral-50 rounded-xl p-6">
              <h4 className="font-medium mb-3">Payment Schedule</h4>
              <p className="text-sm text-neutral-600">
                Commissions are calculated monthly and paid out on the 15th of the following month. 
                Minimum payout threshold is $50.
              </p>
            </div>

            <div className="flex justify-between pt-6">
              <Button variant="ghost" onClick={() => setStep(STEPS.SPECIALTIES)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour
              </Button>
              <Button onClick={() => setStep(STEPS.BEST_PRACTICES)}>
                Continuer <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Best Practices Step */}
        {step === STEPS.BEST_PRACTICES && (
          <motion.div
            key="practices"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-serif mb-2">Best Practices</h2>
              <p className="text-neutral-500">Tips for creating successful collections</p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Tell a Story</h4>
                      <p className="text-sm text-neutral-600">
                        Create collections around occasions, seasons, or moods. "Date Night Elegance" 
                        is more compelling than "Jewelry Collection #1".
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Eye className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Quality Cover Images</h4>
                      <p className="text-sm text-neutral-600">
                        Use high-quality, well-lit cover photos. Lifestyle shots showing items 
                        being worn convert 40% better than flat lays.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bookmark className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Add Styling Notes</h4>
                      <p className="text-sm text-neutral-600">
                        Include personal tips for each item. Explain why you chose it and how 
                        to style it. Your expertise is your value!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Mix Price Points</h4>
                      <p className="text-sm text-neutral-600">
                        Include items at various prices. A mix of investment pieces and 
                        affordable finds makes your collections accessible to more shoppers.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Promote on Social</h4>
                      <p className="text-sm text-neutral-600">
                        Share your collections on Instagram, TikTok, and Pinterest. 
                        Use your unique affiliate links to track conversions.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between pt-6">
              <Button variant="ghost" onClick={() => setStep(STEPS.COMMISSIONS)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour
              </Button>
              <Button onClick={() => setStep(STEPS.REVIEW)}>
                Vérifier & Soumettre <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Review Step */}
        {step === STEPS.REVIEW && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-serif mb-2">✅ Vérifiez Votre Candidature</h2>
              <p className="text-neutral-500">Assurez-vous que tout est correct</p>
            </div>

            {/* Full Profile Preview */}
            <Card className="overflow-hidden">
              {/* Cover Preview */}
              <div className="h-28 bg-gradient-to-r from-purple-200 to-pink-200 relative">
                {formData.cover_image && (
                  <img src={formData.cover_image} alt="Cover" className="w-full h-full object-cover" />
                )}
              </div>
              
              <CardContent className="pt-0 relative">
                {/* Profile Image */}
                <div className="absolute -top-10 left-6">
                  <div className="w-20 h-20 rounded-full border-4 border-white bg-neutral-100 overflow-hidden">
                    {formData.profile_image ? (
                      <img src={formData.profile_image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-medium text-neutral-400">
                        {formData.display_name?.[0]}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-12">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-xl">{formData.display_name}</h3>
                      <p className="text-sm text-neutral-500">{user?.email}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setStep(STEPS.PROFILE_INFO)}>
                      <Edit2 className="w-3 h-3 mr-1" /> Modifier
                    </Button>
                  </div>
                  
                  {formData.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {formData.specialties.map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}
                  
                  {formData.bio && (
                    <p className="text-sm text-neutral-600 mt-4 border-t pt-4">{formData.bio}</p>
                  )}
                  
                  {/* Portfolio Preview */}
                  {formData.portfolio_images.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-neutral-500 mb-2">Portfolio ({formData.portfolio_images.length} images)</p>
                      <div className="flex gap-2">
                        {formData.portfolio_images.slice(0, 4).map((img, idx) => (
                          <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {formData.portfolio_images.length > 4 && (
                          <div className="w-16 h-16 rounded-lg bg-neutral-100 flex items-center justify-center text-sm text-neutral-500">
                            +{formData.portfolio_images.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Social Links Preview */}
                  {Object.values(formData.social_links).some(v => v) && (
                    <div className="mt-4 pt-4 border-t flex gap-3">
                      {formData.social_links.instagram && (
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          <Instagram className="w-3 h-3" /> @{formData.social_links.instagram}
                        </span>
                      )}
                      {formData.social_links.tiktok && (
                        <span className="text-xs text-neutral-500">🎵 @{formData.social_links.tiktok}</span>
                      )}
                      {formData.social_links.youtube && (
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          <Youtube className="w-3 h-3" /> {formData.social_links.youtube}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Terms */}
            <div className="bg-neutral-50 rounded-xl p-6 space-y-4">
              <h4 className="font-medium">Accord Créateur</h4>
              <div className="text-sm text-neutral-600 space-y-2 max-h-32 overflow-y-auto">
                <p>En soumettant cette candidature, vous acceptez de :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Créer du contenu original et de qualité</li>
                  <li>Ne pas s'engager dans des activités d'affiliation frauduleuses</li>
                  <li>Respecter les règles de divulgation FTC</li>
                  <li>Maintenir une conduite professionnelle avec les utilisateurs</li>
                </ul>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox 
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                  id="terms"
                />
                <Label htmlFor="terms" className="text-sm">
                  J'accepte les Conditions Générales des Créateurs
                </Label>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <Button variant="ghost" onClick={() => setStep(STEPS.BEST_PRACTICES)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour
              </Button>
              <Button 
                onClick={() => submitApplication.mutate()}
                disabled={!agreedToTerms || submitApplication.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {submitApplication.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Soumettre la Candidature
              </Button>
            </div>
          </motion.div>
        )}

        {/* Success Step */}
        {step === STEPS.SUCCESS && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-green-100 rounded-full mx-auto mb-8 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-serif mb-4">Candidature Envoyée !</h2>
            <p className="text-neutral-600 mb-8 max-w-md mx-auto">
              Merci d'avoir postulé pour devenir créateur. Notre équipe examinera votre 
              candidature et vous répondra sous 2-3 jours ouvrés.
            </p>
            <Button onClick={() => navigate(createPageUrl('BrandPartnerships'))}>
              Explorer les Collections <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}