import React from 'react';
import { Building2, Server, Mail, User, Globe } from 'lucide-react';
import SEO from '@/components/common/SEO';

export default function LegalNotice() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <SEO title="Mentions Légales" />
      
      <div className="mb-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-neutral-600" />
        </div>
        <h1 className="text-4xl font-serif text-neutral-900 mb-3">Mentions Légales</h1>
        <p className="text-neutral-500">Conformément à la loi n° 2004-575 du 21 juin 2004</p>
      </div>

      <div className="prose prose-neutral max-w-none space-y-8">
        
        {/* Éditeur du site */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Building2 className="w-6 h-6 text-neutral-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-4">Éditeur du Site</h2>
              <div className="text-neutral-600 space-y-2">
                <p><strong>Raison sociale :</strong> L'Écrin Virtuel</p>
                <p><strong>Forme juridique :</strong> Micro-entreprise</p>
                <p><strong>SIRET :</strong> [À compléter]</p>
                <p><strong>Siège social :</strong> [Adresse à compléter]</p>
                <p><strong>Email :</strong> <a href="mailto:contact@lecrinvirtuel.com" className="text-purple-600 hover:text-purple-700 underline">contact@lecrinvirtuel.com</a></p>
                <p><strong>Téléphone :</strong> [À compléter]</p>
              </div>
            </div>
          </div>
        </section>

        {/* Directeur de publication */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <User className="w-6 h-6 text-neutral-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-4">Directeur de Publication</h2>
              <div className="text-neutral-600 space-y-2">
                <p><strong>Nom :</strong> [Nom du responsable légal]</p>
                <p><strong>Qualité :</strong> Gérant</p>
                <p><strong>Email :</strong> <a href="mailto:contact@lecrinvirtuel.com" className="text-purple-600 hover:text-purple-700 underline">contact@lecrinvirtuel.com</a></p>
              </div>
            </div>
          </div>
        </section>

        {/* Hébergement */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Server className="w-6 h-6 text-neutral-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-4">Hébergement</h2>
              <div className="text-neutral-600 space-y-2">
                <p><strong>Hébergeur :</strong> Supabase Inc.</p>
                <p><strong>Adresse :</strong> 970 Toa Payoh North, #07-04, Singapore 318992</p>
                <p><strong>Site web :</strong> <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 underline">supabase.com</a></p>
                <p className="text-sm bg-neutral-50 rounded-lg p-3 border border-neutral-100 mt-3">
                  Les données sont hébergées sur des serveurs sécurisés situés dans l'Union Européenne, 
                  conformément au RGPD.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Développement */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Globe className="w-6 h-6 text-neutral-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-4">Conception et Développement</h2>
              <div className="text-neutral-600 space-y-2">
                <p><strong>Conception :</strong> L'Écrin Virtuel</p>
                <p><strong>Développement technique :</strong> Inferencevision.store</p>
                <p><strong>Technologies utilisées :</strong> React, TailwindCSS, Supabase, OpenAI</p>
              </div>
            </div>
          </div>
        </section>

        {/* Propriété Intellectuelle */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-4">Propriété Intellectuelle</h2>
          <div className="text-neutral-600 space-y-3">
            <p>
              L'ensemble de ce site (structure, textes, graphismes, logos, icônes, sons, logiciels) 
              est la propriété exclusive de L'Écrin Virtuel, à l'exception des marques, logos et contenus 
              appartenant à d'autres sociétés partenaires.
            </p>
            <p>
              Toute reproduction, représentation, modification, publication, adaptation totale ou partielle 
              des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, 
              sauf autorisation écrite préalable de L'Écrin Virtuel.
            </p>
            <p className="text-sm bg-amber-50 rounded-lg p-3 border border-amber-200">
              <strong className="text-amber-900">Exception :</strong> Les utilisateurs peuvent partager 
              leurs créations personnelles sur les réseaux sociaux en mentionnant notre marque.
            </p>
          </div>
        </section>

        {/* Responsabilité */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-4">Limitation de Responsabilité</h2>
          <div className="text-neutral-600 space-y-3">
            <p>
              L'Écrin Virtuel s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées 
              sur ce site, dont elle se réserve le droit de corriger le contenu à tout moment et sans préavis.
            </p>
            <p>
              L'Écrin Virtuel ne saurait être tenue responsable :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Des interruptions du site pour des opérations de maintenance</li>
              <li>De l'impossibilité momentanée d'accès au site</li>
              <li>Des dommages résultant de l'utilisation ou de l'impossibilité d'utiliser le site</li>
              <li>Des préjudices indirects consécutifs à l'utilisation du site</li>
              <li>Des contenus des sites tiers vers lesquels le site pointe</li>
            </ul>
          </div>
        </section>

        {/* Données Personnelles */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Mail className="w-6 h-6 text-neutral-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-4">Protection des Données Personnelles</h2>
              <div className="text-neutral-600 space-y-3">
                <p>
                  L'Écrin Virtuel accorde la plus grande importance à la protection de vos données personnelles 
                  et s'engage à respecter le Règlement Général sur la Protection des Données (RGPD).
                </p>
                <p>
                  Pour plus d'informations sur la collecte et le traitement de vos données, 
                  consultez notre{' '}
                  <a href="/PrivacyPolicy" className="text-purple-600 hover:text-purple-700 underline">
                    Politique de Confidentialité
                  </a>.
                </p>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-3">
                  <p className="text-sm text-purple-900">
                    <strong>Exercice de vos droits RGPD :</strong><br />
                    Vous pouvez exercer vos droits (accès, rectification, effacement, portabilité, opposition) 
                    en nous contactant à <a href="mailto:privacy@lecrinvirtuel.com" className="underline">privacy@lecrinvirtuel.com</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Droit applicable */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-4">Droit Applicable</h2>
          <div className="text-neutral-600">
            <p>
              Les présentes mentions légales sont soumises au droit français. 
              En cas de litige et à défaut d'accord amiable, le litige sera porté devant 
              les tribunaux français conformément aux règles de compétence en vigueur.
            </p>
          </div>
        </section>

        {/* Crédits */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-4">Crédits</h2>
          <div className="text-neutral-600 space-y-2">
            <p><strong>Icônes :</strong> Lucide Icons</p>
            <p><strong>Intelligence Artificielle :</strong> OpenAI (GPT-4, DALL-E)</p>
            <p><strong>Framework :</strong> React.js</p>
            <p><strong>Hébergement :</strong> Supabase</p>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-2xl p-8 border border-neutral-200">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">Contact</h2>
          <div className="text-neutral-600 space-y-2">
            <p>Pour toute question concernant ces mentions légales ou le site en général :</p>
            <p className="mt-3">
              <strong>Email :</strong>{' '}
              <a href="mailto:contact@lecrinvirtuel.com" className="text-purple-600 hover:text-purple-700 underline">
                contact@lecrinvirtuel.com
              </a>
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}