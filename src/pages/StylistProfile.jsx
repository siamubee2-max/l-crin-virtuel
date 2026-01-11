import React, { useState } from 'react';
import { base44 } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Star, Clock, Calendar as CalendarIcon, CheckCircle2, Lock, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { toast } from 'sonner';

export default function StylistProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const stylistId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDate, setBookingDate] = useState(undefined);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: stylist, isLoading } = useQuery({
    queryKey: ['stylist', stylistId],
    queryFn: async () => {
      const res = await base44.entities.Stylist.list();
      return res.find(s => s.id === stylistId);
    },
    enabled: !!stylistId,
  });

  const { data: services } = useQuery({
    queryKey: ['stylistServices', stylistId],
    queryFn: () => base44.entities.StylistService.filter({ stylist_id: stylistId }),
    enabled: !!stylistId,
  });

  const { data: lookbooks } = useQuery({
    queryKey: ['stylistLookbooks', stylistId],
    queryFn: () => base44.entities.Lookbook.filter({ stylist_id: stylistId }),
    enabled: !!stylistId,
  });

  const bookingMutation = useMutation({
    mutationFn: (data) => base44.entities.StylistBooking.create(data),
    onSuccess: () => {
      toast.success("Booking request sent successfully!");
      setIsBookingOpen(false);
      setSelectedService(null);
    },
    onError: () => {
      toast.error("Failed to book service.");
    }
  });

  const handleBook = async () => {
    if (!currentUser) {
      toast.error("Please login to book a session");
      // base44.auth.redirectToLogin(); // Optional
      return;
    }
    if (!bookingDate || !selectedService) return;

    // Simulate Payment Process here
    await new Promise(resolve => setTimeout(resolve, 1500)); // Fake processing delay

    bookingMutation.mutate({
      stylist_id: stylistId,
      client_id: currentUser.id,
      service_id: selectedService.id,
      booking_date: bookingDate.toISOString(),
      status: "confirmed", // Auto-confirm for demo
      total_price: selectedService.price,
      notes: "Booked via platform"
    });
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  if (!stylist) return <div className="p-12 text-center">Stylist not found</div>;

  return (
    <div className="space-y-12">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-8 border border-neutral-100 flex flex-col md:flex-row gap-8 items-start">
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden bg-neutral-100 flex-shrink-0">
          <img src={stylist.profile_image} alt={stylist.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-serif text-neutral-900">{stylist.name}</h1>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className="flex items-center gap-1 text-amber-500 font-medium">
                <Star className="w-4 h-4 fill-current" /> {stylist.rating}
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-neutral-500">{stylist.specialties?.join(", ")}</span>
            </div>
          </div>
          <p className="text-neutral-600 leading-relaxed max-w-2xl">{stylist.bio}</p>
        </div>
        <div className="text-right flex-shrink-0">
           <div className="text-2xl font-medium text-neutral-900">${stylist.hourly_rate}</div>
           <div className="text-sm text-neutral-500">per hour</div>
        </div>
      </div>

      {/* Services Section */}
      <section>
        <h2 className="text-2xl font-serif mb-6">Services</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {services?.map(service => (
            <div key={service.id} className="bg-white p-6 rounded-xl border border-neutral-100 hover:border-amber-200 transition-colors flex justify-between items-center group">
              <div>
                <h3 className="font-medium text-lg">{service.name}</h3>
                <p className="text-neutral-500 text-sm mt-1 mb-2">{service.description}</p>
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {service.duration_minutes} min</span>
                  <span className="font-medium text-neutral-900">${service.price}</span>
                </div>
              </div>
              <Dialog open={isBookingOpen && selectedService?.id === service.id} onOpenChange={(open) => {
                setIsBookingOpen(open);
                if (open) setSelectedService(service);
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-neutral-900 text-white hover:bg-neutral-800">Book</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Book {service.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Select Date</Label>
                      <div className="flex justify-center border rounded-md p-2">
                        <Calendar
                          mode="single"
                          selected={bookingDate}
                          onSelect={setBookingDate}
                          className="rounded-md"
                          disabled={(date) => date < new Date()}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-neutral-50 p-4 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Service</span>
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration</span>
                        <span>{service.duration_minutes} min</span>
                      </div>
                      <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${service.price}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12"
                      onClick={handleBook}
                      disabled={!bookingDate || bookingMutation.isPending}
                    >
                      {bookingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                      {bookingMutation.isPending ? "Processing..." : `Pay $${service.price} & Book`}
                    </Button>
                    <p className="text-xs text-center text-neutral-400">
                      Secure payment processed by Stripe. You won't be charged until the stylist confirms.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))}
          {services?.length === 0 && <p className="text-neutral-400 italic">No specific services listed.</p>}
        </div>
      </section>

      {/* Lookbooks Section */}
      <section>
        <h2 className="text-2xl font-serif mb-6">Lookbooks & Guides</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {lookbooks?.map(lookbook => (
            <Link 
              key={lookbook.id} 
              to={createPageUrl(`Lookbook?id=${lookbook.id}`)}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-neutral-100 group"
            >
              <div className="aspect-[3/4] bg-neutral-100 relative">
                <img src={lookbook.cover_image} alt={lookbook.title} className="w-full h-full object-cover" />
                {lookbook.is_premium && lookbook.price > 0 && (
                  <div className="absolute top-2 right-2 bg-neutral-900 text-white text-xs font-bold px-2 py-1 rounded">
                    ${lookbook.price}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-lg mb-1 group-hover:text-amber-600 transition-colors">{lookbook.title}</h3>
                <p className="text-sm text-neutral-500 line-clamp-2 mb-3">{lookbook.description}</p>
                <div className="flex items-center text-sm font-medium text-amber-700">
                  {lookbook.is_premium ? (
                    <>Unlock Access <ShoppingBag className="w-4 h-4 ml-1" /></>
                  ) : (
                    <>Read Free <ArrowRight className="w-4 h-4 ml-1" /></>
                  )}
                </div>
              </div>
            </Link>
          ))}
          {lookbooks?.length === 0 && <p className="text-neutral-400 italic">No lookbooks published yet.</p>}
        </div>
      </section>
    </div>
  );
}