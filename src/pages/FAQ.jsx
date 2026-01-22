import React, { useState } from 'react';
import { ChevronDown, Search, HelpCircle, Sparkles, Lock, CreditCard, Package, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '@/components/common/SEO';

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndex, setOpenIndex] = useState(null);

  const categories = [
    {
      title: "Utilisation de la Plateforme",
      icon: Sparkles,
      questions: [
        {
          q: "Comment fonctionne l'essayage virtuel ?",
          a: "Téléchargez une photo de bijou, sélectionnez une photo de vous dans votre bibliothèque, et notre IA génère un rendu photoréaliste du bijou porté en quelques secondes. L'IA analyse votre teint, l'éclairage et la perspective pour un résultat naturel."
        },
        {
          q: "Dois-je créer un compte pour utiliser le service ?",
          a: "Oui, un compte gratuit est nécessaire pour sauvegarder vos photos, créations et préférences de style. L'inscription est rapide et sécurisée."
        },
        {
          q: "Quels types de bijoux puis-je essayer ?",
          a: "Vous pouvez essayer des boucles d'oreilles, colliers, bagues, bracelets, bracelets de cheville et même des parures complètes. Notre IA adapte le placement selon le type de bijou."
        },
        {
          q: "Mes photos sont-elles privées ?",
          a: "Absolument. Vos photos sont stockées de manière sécurisée et ne sont jamais partagées avec des tiers. Nous ne les utilisons pas pour entraîner nos modèles d'IA sans votre consentement explicite."
        },
        {
          q: "Comment prendre de bonnes photos pour l'essayage ?",
          a: "Utilisez un bon éclairage naturel, prenez des photos nettes et bien cadrées sur la partie du corps concernée (oreille pour boucles, cou pour colliers, etc.). Évitez les ombres trop marquées."
        }
      ]
    },
    {
      title: "Fonctionnalités Premium",
      icon: Lock,
      questions: [
        {
          q: "Qu'est-ce que l'abonnement Premium inclut ?",
          a: "L'abonnement Premium vous donne accès au Styliste IA avec recommandations personnalisées, analyse de teint, suggestions de looks, accès prioritaire aux nouvelles fonctionnalités et support client prioritaire."
        },
        {
          q: "Puis-je annuler mon abonnement à tout moment ?",
          a: "Oui, vous pouvez annuler votre abonnement depuis votre profil à tout moment. Vous conserverez l'accès jusqu'à la fin de la période payée."
        },
        {
          q: "Y a-t-il une période d'essai gratuite ?",
          a: "Nous proposons régulièrement des promotions avec période d'essai. Consultez la page Abonnement pour les offres en cours."
        }
      ]
    },
    {
      title: "Achats et Paiements",
      icon: CreditCard,
      questions: [
        {
          q: "Comment puis-je acheter les bijoux que j'essaie ?",
          a: "Cliquez sur le lien 'Acheter' sous le bijou pour être redirigé vers la boutique de notre partenaire. La transaction se fait directement avec le vendeur."
        },
        {
          q: "Est-ce que L'Écrin Virtuel vend des bijoux ?",
          a: "Non, nous sommes une plateforme d'essayage virtuel. Nous travaillons avec des marques partenaires et recevons une commission sur les ventes via nos liens affiliés."
        },
        {
          q: "Quels moyens de paiement acceptez-vous ?",
          a: "Pour l'abonnement Premium, nous acceptons les cartes bancaires (Visa, Mastercard, Amex) via notre plateforme de paiement sécurisée Stripe."
        },
        {
          q: "Puis-je obtenir un remboursement ?",
          a: "Conformément au droit européen, vous disposez de 14 jours de rétractation pour l'abonnement Premium. Contactez-nous à support@lecrinvirtuel.com."
        }
      ]
    },
    {
      title: "Technique et Qualité",
      icon: Package,
      questions: [
        {
          q: "Pourquoi le rendu ne correspond pas exactement à mes attentes ?",
          a: "La qualité dépend de la photo source. Assurez-vous d'utiliser des images nettes, bien éclairées et correctement cadrées. Vous pouvez utiliser notre éditeur pour ajuster le résultat."
        },
        {
          q: "Combien de temps prend la génération ?",
          a: "La génération prend généralement 5 à 15 secondes selon la complexité du bijou et la charge du serveur."
        },
        {
          q: "Puis-je utiliser l'essayage en direct avec ma webcam ?",
          a: "Oui ! Le mode Miroir AR vous permet d'essayer des bijoux en temps réel via votre webcam. Cette fonctionnalité nécessite l'autorisation d'accès à votre caméra."
        },
        {
          q: "Les résultats sont-ils réalistes ?",
          a: "Notre IA génère des rendus photoréalistes en tenant compte de l'éclairage, des ombres et de la perspective. Le résultat est une simulation très proche de la réalité."
        }
      ]
    },
    {
      title: "Support et Contact",
      icon: MessageCircle,
      questions: [
        {
          q: "Comment contacter le support client ?",
          a: "Envoyez-nous un email à support@lecrinvirtuel.com. Les abonnés Premium bénéficient d'un support prioritaire avec réponse sous 24h."
        },
        {
          q: "J'ai une suggestion de fonctionnalité, où puis-je la partager ?",
          a: "Nous adorons les retours ! Envoyez vos suggestions à feedback@lecrinvirtuel.com. Nous lisons toutes les suggestions et les intégrons dans notre roadmap."
        },
        {
          q: "Puis-je devenir partenaire créateur ?",
          a: "Oui ! Nous recherchons des créateurs de contenu et stylistes. Consultez notre page Créateurs ou contactez-nous à partners@lecrinvirtuel.com."
        }
      ]
    }
  ];

  const allQuestions = categories.flatMap((cat, catIdx) => 
    cat.questions.map((q, qIdx) => ({ 
      ...q, 
      category: cat.title, 
      icon: cat.icon,
      globalIndex: `${catIdx}-${qIdx}` 
    }))
  );

  const filteredQuestions = searchQuery.trim() 
    ? allQuestions.filter(item => 
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <div className="max-w-4xl mx-auto py-12">
      <SEO 
        title="FAQ - Questions Fréquentes" 
        description="Trouvez des réponses à toutes vos questions sur l'essayage virtuel de bijoux, les abonnements et notre plateforme."
      />
      
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-purple-100 flex items-center justify-center">
          <HelpCircle className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-4xl font-serif text-neutral-900 mb-3">Questions Fréquentes</h1>
        <p className="text-neutral-500 max-w-2xl mx-auto">
          Trouvez rapidement des réponses à vos questions sur L'Écrin Virtuel
        </p>
      </div>

      {/* Search */}
      <div className="mb-8 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <Input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une question..."
          className="pl-12 h-14 text-base rounded-2xl border-neutral-200 focus:border-amber-300 focus:ring-amber-200"
        />
      </div>

      {/* Search Results */}
      {filteredQuestions ? (
        <div className="space-y-3">
          <p className="text-sm text-neutral-500 mb-4">
            {filteredQuestions.length} résultat{filteredQuestions.length > 1 ? 's' : ''} trouvé{filteredQuestions.length > 1 ? 's' : ''}
          </p>
          {filteredQuestions.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.globalIndex}
                onClick={() => setOpenIndex(openIndex === item.globalIndex ? null : item.globalIndex)}
                className="bg-white rounded-2xl border border-neutral-200 p-6 cursor-pointer hover:border-amber-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold text-neutral-900">{item.q}</h3>
                      <ChevronDown className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform ${openIndex === item.globalIndex ? 'rotate-180' : ''}`} />
                    </div>
                    <p className="text-xs text-neutral-500 mb-2">{item.category}</p>
                    <AnimatePresence>
                      {openIndex === item.globalIndex && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="text-neutral-600 leading-relaxed mt-3">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-500">Aucune question ne correspond à votre recherche.</p>
            </div>
          )}
        </div>
      ) : (
        /* Categories */
        <div className="space-y-8">
          {categories.map((category, catIdx) => {
            const Icon = category.icon;
            return (
              <div key={catIdx} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-purple-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-serif text-neutral-900">{category.title}</h2>
                </div>

                <div className="space-y-3">
                  {category.questions.map((item, qIdx) => {
                    const globalIndex = `${catIdx}-${qIdx}`;
                    return (
                      <div 
                        key={qIdx}
                        onClick={() => setOpenIndex(openIndex === globalIndex ? null : globalIndex)}
                        className="bg-white rounded-2xl border border-neutral-200 p-6 cursor-pointer hover:border-amber-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-semibold text-neutral-900 flex-1">{item.q}</h3>
                          <ChevronDown className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform ${openIndex === globalIndex ? 'rotate-180' : ''}`} />
                        </div>
                        <AnimatePresence>
                          {openIndex === globalIndex && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <p className="text-neutral-600 leading-relaxed mt-4">{item.a}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contact CTA */}
      <div className="mt-16 bg-gradient-to-br from-amber-50 to-purple-50 rounded-3xl p-8 text-center border border-amber-200">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-amber-600" />
        <h3 className="text-xl font-serif text-neutral-900 mb-2">Vous ne trouvez pas votre réponse ?</h3>
        <p className="text-neutral-600 mb-4">Notre équipe est là pour vous aider</p>
        <a 
          href="mailto:support@lecrinvirtuel.com"
          className="inline-block bg-amber-600 text-white px-6 py-3 rounded-full font-medium hover:bg-amber-700 transition-colors"
        >
          Nous Contacter
        </a>
      </div>
    </div>
  );
}