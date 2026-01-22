import React from 'react';
import { Star, Sparkles, Diamond } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sophie Martin",
      role: "Passionnée de mode",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "L'essayage virtuel est incroyable ! J'ai pu visualiser mes futurs bijoux avant de les acheter. Un gain de temps énorme."
    },
    {
      name: "Emma Dubois",
      role: "Créatrice de contenu",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "L'IA comprend parfaitement mon style. Les recommandations sont toujours justes et élégantes. Je recommande vivement !"
    },
    {
      name: "Léa Bernard",
      role: "Styliste",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "Un outil révolutionnaire pour mes clientes. La qualité des rendus est exceptionnelle, on dirait de vraies photos professionnelles."
    },
    {
      name: "Clara Rousseau",
      role: "Influenceuse lifestyle",
      avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "J'utilise L'Écrin Virtuel tous les jours pour créer du contenu. Mes followers adorent voir les bijoux portés avant l'achat."
    },
    {
      name: "Camille Laurent",
      role: "Entrepreneure",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "Interface intuitive et résultats bluffants. Parfait pour les achats en ligne, je ne commande plus sans essayer virtuellement."
    },
    {
      name: "Julie Petit",
      role: "Blogueuse mode",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "La précision de l'essayage est impressionnante. Les bijoux s'intègrent naturellement aux photos, comme si je les portais vraiment."
    }
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-amber-50 via-white to-purple-50 rounded-3xl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            EXCLUSIF
          </div>
          <h2 className="text-4xl md:text-5xl font-serif text-neutral-900 mb-4">
            Découvrez la magie de <br />
            <span className="text-amber-600 italic">l'essayage virtuel</span>
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-neutral-100"
          >
            <p className="text-4xl font-bold text-amber-600 mb-2">Plus de 50 000</p>
            <p className="text-neutral-600">Essais</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-neutral-100"
          >
            <p className="text-4xl font-bold text-amber-600 mb-2">98%</p>
            <p className="text-neutral-600">Satisfaction</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-neutral-100"
          >
            <p className="text-4xl font-bold text-amber-600 mb-2">Plus de 500</p>
            <p className="text-neutral-600">Bijoux</p>
          </motion.div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-start gap-4 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-neutral-100"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Diamond className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-1">IA Avancée</h3>
              <p className="text-sm text-neutral-600">Placement précis et réaliste</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-start gap-4 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-neutral-100"
          >
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-1">Bijoux Artisanaux</h3>
              <p className="text-sm text-neutral-600">Collection exclusive</p>
            </div>
          </motion.div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-neutral-100"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-neutral-700 text-sm mb-4 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-neutral-900 text-sm">{testimonial.name}</p>
                  <p className="text-xs text-neutral-500">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-neutral-500">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Sans engagement
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Résultat instantané
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            100% sécurisé
          </div>
        </div>
      </div>
    </section>
  );
}