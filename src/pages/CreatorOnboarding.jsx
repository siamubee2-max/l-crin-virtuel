import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
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
  Instagram, Youtube, Globe, Star, Bookmark, Eye, AlertCircle, X, ImagePlus, Info
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

            <Button size="lg" onClick={() => setStep(STEPS.PROFILE)} className="px-8">
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Profile Setup Step */}
        {step === STEPS.PROFILE && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-serif mb-2">Create Your Profile</h2>
              <p className="text-neutral-500">Tell us about yourself and your style expertise</p>
            </div>

            {/* Cover & Profile Image */}
            <div className="relative">
              <div className="h-32 bg-gradient-to-r from-purple-200 to-pink-200 rounded-xl overflow-hidden">
                {formData.cover_image && (
                  <img src={formData.cover_image} alt="Cover" className="w-full h-full object-cover" />
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white text-sm">
                  <Camera className="w-5 h-5 mr-2" /> Upload Cover
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover_image')} className="hidden" />
                </label>
              </div>
              
              <div className="absolute -bottom-10 left-6">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-neutral-100 overflow-hidden relative">
                  {formData.profile_image ? (
                    <img src={formData.profile_image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile_image')} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-12 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Display Name *</Label>
                  <Input 
                    value={formData.display_name}
                    onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                    placeholder="Your creator name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Tell your audience about your style journey and expertise..."
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <Label>Style Specialties</Label>
                <div className="flex flex-wrap gap-2">
                  {specialtyOptions.map(specialty => (
                    <button
                      key={specialty}
                      onClick={() => toggleSpecialty(specialty)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        formData.specialties.includes(specialty)
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white hover:border-neutral-400'
                      }`}
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Social Links (Optional)</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-500" />
                    <Input 
                      value={formData.social_links.instagram}
                      onChange={(e) => setFormData({...formData, social_links: {...formData.social_links, instagram: e.target.value}})}
                      placeholder="Instagram username"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center text-sm">🎵</div>
                    <Input 
                      value={formData.social_links.tiktok}
                      onChange={(e) => setFormData({...formData, social_links: {...formData.social_links, tiktok: e.target.value}})}
                      placeholder="TikTok username"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-500" />
                    <Input 
                      value={formData.social_links.youtube}
                      onChange={(e) => setFormData({...formData, social_links: {...formData.social_links, youtube: e.target.value}})}
                      placeholder="YouTube channel"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-neutral-500" />
                    <Input 
                      value={formData.social_links.website}
                      onChange={(e) => setFormData({...formData, social_links: {...formData.social_links, website: e.target.value}})}
                      placeholder="Website URL"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <Button variant="ghost" onClick={() => setStep(STEPS.WELCOME)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={() => setStep(STEPS.COMMISSIONS)} disabled={!formData.display_name}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
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
              <Button variant="ghost" onClick={() => setStep(STEPS.PROFILE)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={() => setStep(STEPS.BEST_PRACTICES)}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
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
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={() => setStep(STEPS.REVIEW)}>
                Review & Submit <ArrowRight className="w-4 h-4 ml-2" />
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
              <h2 className="text-2xl font-serif mb-2">Review Your Application</h2>
              <p className="text-neutral-500">Make sure everything looks good</p>
            </div>

            {/* Profile Preview */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 overflow-hidden">
                    {formData.profile_image ? (
                      <img src={formData.profile_image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-medium text-neutral-400">
                        {formData.display_name?.[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{formData.display_name}</h3>
                    <p className="text-sm text-neutral-500">{user?.email}</p>
                    {formData.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formData.specialties.map(s => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {formData.bio && (
                  <p className="text-sm text-neutral-600 mt-4 border-t pt-4">{formData.bio}</p>
                )}
              </CardContent>
            </Card>

            {/* Terms */}
            <div className="bg-neutral-50 rounded-xl p-6 space-y-4">
              <h4 className="font-medium">Creator Agreement</h4>
              <div className="text-sm text-neutral-600 space-y-2 max-h-32 overflow-y-auto">
                <p>By submitting this application, you agree to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Create original, high-quality content</li>
                  <li>Not engage in fraudulent affiliate activity</li>
                  <li>Comply with FTC disclosure guidelines</li>
                  <li>Maintain professional conduct with users</li>
                </ul>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox 
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                  id="terms"
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the Creator Terms & Conditions
                </Label>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <Button variant="ghost" onClick={() => setStep(STEPS.BEST_PRACTICES)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
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
                Submit Application
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
            <h2 className="text-3xl font-serif mb-4">Application Submitted!</h2>
            <p className="text-neutral-600 mb-8 max-w-md mx-auto">
              Thank you for applying to become a creator. Our team will review your 
              application and get back to you within 2-3 business days.
            </p>
            <Button onClick={() => navigate(createPageUrl('BrandPartnerships'))}>
              Explore Collections <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}