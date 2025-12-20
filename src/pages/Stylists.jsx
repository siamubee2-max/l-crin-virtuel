import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Calendar as CalendarIcon, Clock, Sparkles, BookOpen, UserCheck, ShieldCheck, Loader2 } from "lucide-react";
import { format } from 'date-fns';

function StylistCard({ stylist, user, onBook, onSelect }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer" onClick={() => onSelect(stylist)}>
      <div className="aspect-[4/3] bg-neutral-100 relative">
        {stylist.portfolio_images?.[0] ? (
          <img src={stylist.portfolio_images[0]} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-300"><UserCheck className="w-12 h-12" /></div>
        )}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow-sm">
           <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {stylist.rating}
        </div>
      </div>
      <CardContent className="p-5">
         <div className="flex justify-between items-start mb-2">
            <div>
               <h3 className="font-serif text-lg font-medium">{user?.full_name || "Stylist"}</h3>
               <p className="text-sm text-neutral-500">Rate: ${stylist.hourly_rate}/hr</p>
            </div>
            <Avatar>
               <AvatarImage src={user?.avatar_url} />
               <AvatarFallback>{user?.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
         </div>
         <p className="text-sm text-neutral-600 line-clamp-2 mb-3">{stylist.bio}</p>
         <div className="flex flex-wrap gap-1">
            {stylist.specialties?.slice(0, 3).map(s => (
               <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
            ))}
         </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
         <Button className="w-full bg-neutral-900 text-white" onClick={(e) => { e.stopPropagation(); onBook(stylist); }}>Book Session</Button>
      </CardFooter>
    </Card>
  );
}

function AIAnalysisTool() {
   const [image, setImage] = useState("");
   const [analysis, setAnalysis] = useState(null);
   const [loading, setLoading] = useState(false);

   const handleAnalyze = async () => {
      if (!image) return;
      setLoading(true);
      try {
         const prompt = `
            Act as a high-end personal stylist. Analyze this outfit/item image in depth.
            Provide a JSON report:
            - body_type_suitability: What body types does this flatter and why?
            - color_analysis: What season/undertone fits this best?
            - pairing_suggestions: Specific suggestions for what to wear with this (shoes, jewelry, layers).
            - occasion_score: 0-10 scores for Casual, Work, Party, Formal.
            - trend_verdict: Is it timeless, trendy, or dated?
         `;
         const res = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            file_urls: [image],
            response_json_schema: {
               type: "object",
               properties: {
                  body_type_suitability: { type: "string" },
                  color_analysis: { type: "string" },
                  pairing_suggestions: { type: "string" },
                  occasion_score: { 
                     type: "object", 
                     properties: { Casual: {type: "number"}, Work: {type: "number"}, Party: {type: "number"}, Formal: {type: "number"} } 
                  },
                  trend_verdict: { type: "string" }
               }
            }
         });
         setAnalysis(res);
      } catch (e) {
         console.error(e);
      } finally {
         setLoading(false);
      }
   };

   return (
      <Card className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white border-0">
         <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif"><Sparkles className="w-5 h-5 text-amber-400" /> Deep AI Style Analysis</CardTitle>
            <CardDescription className="text-neutral-400">Get a comprehensive breakdown of any item or outfit.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            {!analysis ? (
               <div className="space-y-4">
                  <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer relative">
                     <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                           setLoading(true);
                           const up = await base44.integrations.Core.UploadFile({ file });
                           setImage(up.file_url);
                           setLoading(false);
                        }
                     }} />
                     {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400" /> : image ? <img src={image} className="h-40 mx-auto object-contain" /> : <div className="text-neutral-400"><p>Upload Photo</p></div>}
                  </div>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" disabled={!image || loading} onClick={handleAnalyze}>
                     {loading ? "Analyzing..." : "Generate Report"}
                  </Button>
               </div>
            ) : (
               <div className="space-y-4 text-sm">
                  <div className="bg-white/10 p-3 rounded-lg">
                     <p className="font-bold text-amber-400 mb-1">Color & Body</p>
                     <p className="mb-2">{analysis.color_analysis}</p>
                     <p className="text-neutral-300">{analysis.body_type_suitability}</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg">
                     <p className="font-bold text-amber-400 mb-1">Styling Advice</p>
                     <p>{analysis.pairing_suggestions}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                     {Object.entries(analysis.occasion_score || {}).map(([k, v]) => (
                        <div key={k} className="bg-white/5 p-2 rounded">
                           <p className="text-[10px] uppercase tracking-wider text-neutral-400">{k}</p>
                           <p className="font-bold text-lg">{v}</p>
                        </div>
                     ))}
                  </div>
                  <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white" onClick={() => { setAnalysis(null); setImage(""); }}>Analyze Another</Button>
               </div>
            )}
         </CardContent>
      </Card>
   );
}

export default function Stylists() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingNote, setBookingNote] = useState("");
  const queryClient = useQueryClient();

  const { data: stylists } = useQuery({
     queryKey: ['stylists'],
     queryFn: () => base44.entities.StylistProfile.list()
  });

  const { data: users } = useQuery({
     queryKey: ['users'],
     queryFn: () => base44.entities.User.list()
  });

  const { data: currentUser } = useQuery({
     queryKey: ['currentUser'],
     queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: lookbooks } = useQuery({
     queryKey: ['lookbooks'],
     queryFn: () => base44.entities.Lookbook.list()
  });

  const bookingMutation = useMutation({
     mutationFn: () => base44.entities.Booking.create({
        stylist_id: selectedStylist.id,
        client_id: currentUser.id,
        date: selectedDate.toISOString(),
        notes: bookingNote,
        status: "pending"
     }),
     onSuccess: () => {
        setIsBookingOpen(false);
        setBookingNote("");
        alert("Booking request sent!");
     }
  });

  const getUser = (uid) => users?.find(u => u.id === uid);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
       <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif text-neutral-900">Personal Stylists</h1>
          <p className="text-neutral-500 max-w-xl mx-auto">Connect with professional stylists for 1-on-1 sessions, curated lookbooks, and expert advice to elevate your personal style.</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stylists?.map(stylist => (
                   <StylistCard 
                      key={stylist.id} 
                      stylist={stylist} 
                      user={getUser(stylist.user_id)} 
                      onBook={(s) => { setSelectedStylist(s); setIsBookingOpen(true); }}
                      onSelect={(s) => { /* Could open detailed profile */ }}
                   />
                ))}
             </div>
             
             <div>
                <h2 className="text-2xl font-serif mb-6">Curated Lookbooks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {lookbooks?.map(lb => (
                      <div key={lb.id} className="group relative aspect-video rounded-xl overflow-hidden cursor-pointer">
                         <img src={lb.cover_image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                            <h3 className="font-serif text-xl">{lb.title}</h3>
                            <p className="text-sm text-neutral-300 line-clamp-1">{lb.description}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="space-y-8">
             <AIAnalysisTool />
             
             <Card className="bg-amber-50 border-amber-100">
                <CardHeader>
                   <CardTitle className="font-serif text-amber-900">Why book a stylist?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-amber-900/80">
                   <div className="flex gap-3">
                      <ShieldCheck className="w-5 h-5 shrink-0" />
                      <p>Expert audit of your current wardrobe to find hidden gems and gaps.</p>
                   </div>
                   <div className="flex gap-3">
                      <Sparkles className="w-5 h-5 shrink-0" />
                      <p>Personalized shopping list tailored to your budget and body type.</p>
                   </div>
                   <div className="flex gap-3">
                      <BookOpen className="w-5 h-5 shrink-0" />
                      <p>Receive a digital lookbook with 20+ outfit combinations.</p>
                   </div>
                </CardContent>
             </Card>
          </div>
       </div>

       <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          <DialogContent>
             <DialogHeader>
                <DialogTitle>Book a Session</DialogTitle>
             </DialogHeader>
             <div className="space-y-4 py-4">
                <div className="flex justify-center">
                   <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                   />
                </div>
                <div className="space-y-2">
                   <Label>Session Notes / Goals</Label>
                   <Textarea 
                      placeholder="What do you want to achieve? e.g. Wardrobe refresh for new job..." 
                      value={bookingNote}
                      onChange={e => setBookingNote(e.target.value)}
                   />
                </div>
                <Button className="w-full bg-neutral-900 text-white" onClick={() => bookingMutation.mutate()}>
                   Confirm Booking
                </Button>
             </div>
          </DialogContent>
       </Dialog>
    </div>
  );
}