import React from 'react';
import { Cookie, Settings, BarChart3, Shield } from 'lucide-react';
import SEO from '@/components/common/SEO';

export default function CookiePolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <SEO title="Politique de Cookies" />
      
      <div className="mb-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
          <Cookie className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-4xl font-serif text-neutral-900 mb-3">Politique de Cookies</h1>
        <p className="text-neutral-500">Dernière mise à jour : 22 janvier 2026</p>
      </div>

      <div className="prose prose-neutral max-w-none space-y-8">
        
        {/* Qu'est-ce qu'un cookie */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Cookie className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-3">Qu'est-ce qu'un Cookie ?</h2>
              <div className="text-neutral-600 space-y-3">
                <p>
                  Un cookie est un petit fichier texte stocké sur votre appareil lorsque vous visitez un site web. 
                  Les cookies permettent au site de mémoriser vos préférences et d'améliorer votre expérience utilisateur.
                </p>
                <p className="text-sm bg-amber-50 rounded-lg p-3 border border-amber-200">
                  Les cookies ne peuvent pas exécuter de programmes ni transmettre de virus. Ils sont simplement 
                  des fichiers de données.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Types de cookies */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-4">Types de Cookies Utilisés</h2>
          
          <div className="space-y-6">
            {/* Cookies Essentiels */}
            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex items-start gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-neutral-900">Cookies Essentiels (Obligatoires)</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    Nécessaires au fonctionnement du site. Ces cookies ne peuvent pas être désactivés.
                  </p>
                </div>
              </div>
              <div className="mt-3 text-sm text-neutral-600 space-y-2">
                <p><strong>Exemples :</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><code className="bg-neutral-100 px-1 rounded">auth_token</code> - Authentification (7 jours)</li>
                  <li><code className="bg-neutral-100 px-1 rounded">session_id</code> - Gestion de session (Session)</li>
                  <li><code className="bg-neutral-100 px-1 rounded">csrf_token</code> - Protection contre les attaques (Session)</li>
                </ul>
              </div>
            </div>

            {/* Cookies de Préférence */}
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-start gap-2 mb-2">
                <Settings className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-neutral-900">Cookies de Préférence (Optionnels)</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    Permettent de mémoriser vos préférences et paramètres.
                  </p>
                </div>
              </div>
              <div className="mt-3 text-sm text-neutral-600 space-y-2">
                <p><strong>Exemples :</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><code className="bg-neutral-100 px-1 rounded">user_language</code> - Langue sélectionnée (1 an)</li>
                  <li><code className="bg-neutral-100 px-1 rounded">theme_preference</code> - Mode sombre/clair (1 an)</li>
                  <li><code className="bg-neutral-100 px-1 rounded">cookie_consent</code> - Vos choix de cookies (1 an)</li>
                </ul>
              </div>
            </div>

            {/* Cookies Analytiques */}
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="flex items-start gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-neutral-900">Cookies Analytiques (Optionnels)</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    Nous aident à comprendre comment les visiteurs utilisent notre site.
                  </p>
                </div>
              </div>
              <div className="mt-3 text-sm text-neutral-600 space-y-2">
                <p><strong>Données collectées :</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Pages visitées et durée de visite</li>
                  <li>Source de trafic (Google, réseaux sociaux, etc.)</li>
                  <li>Type d'appareil et navigateur utilisé</li>
                  <li>Actions effectuées (clics, formulaires)</li>
                </ul>
                <p className="text-xs mt-2 bg-purple-50 rounded p-2 border border-purple-100">
                  Ces données sont anonymisées et ne permettent pas de vous identifier personnellement.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cookies Tiers */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">Cookies Tiers</h2>
          <div className="text-neutral-600 space-y-4">
            <p>Nous utilisons des services tiers qui déposent leurs propres cookies :</p>
            
            <div className="space-y-3">
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
                <h3 className="font-medium text-neutral-900 mb-2">Supabase (Hébergement)</h3>
                <p className="text-sm">Cookies d'authentification et de sécurité</p>
                <p className="text-xs text-neutral-500 mt-1">Politique : <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com/privacy</a></p>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
                <h3 className="font-medium text-neutral-900 mb-2">OpenAI (Intelligence Artificielle)</h3>
                <p className="text-sm">Traitement des images pour l'essayage virtuel</p>
                <p className="text-xs text-neutral-500 mt-1">Politique : <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">openai.com/privacy</a></p>
              </div>
            </div>
          </div>
        </section>

        {/* Gestion des Cookies */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">Gérer Vos Cookies</h2>
          <div className="text-neutral-600 space-y-4">
            <h3 className="font-medium text-neutral-900">Via votre navigateur</h3>
            <p>Vous pouvez configurer votre navigateur pour :</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Bloquer tous les cookies</li>
              <li>Accepter uniquement les cookies du site visité</li>
              <li>Supprimer les cookies après chaque session</li>
              <li>Recevoir une notification avant l'installation d'un cookie</li>
            </ul>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-900 mb-2"><strong>Guides par navigateur :</strong></p>
              <ul className="text-xs space-y-1 text-blue-800">
                <li>• <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="underline">Chrome</a></li>
                <li>• <a href="https://support.mozilla.org/fr/kb/protection-renforcee-contre-pistage-firefox-ordinateur" target="_blank" rel="noopener noreferrer" className="underline">Firefox</a></li>
                <li>• <a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="underline">Safari</a></li>
                <li>• <a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="underline">Edge</a></li>
              </ul>
            </div>

            <p className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
              <strong className="text-amber-900">Attention :</strong> Bloquer tous les cookies peut empêcher 
              certaines fonctionnalités du site de fonctionner correctement (connexion, panier, etc.).
            </p>
          </div>
        </section>

        {/* Durée de Conservation */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">Durée de Conservation</h2>
          <div className="text-neutral-600">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Durée</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100">
                  <td className="p-3">Cookies essentiels</td>
                  <td className="p-3">Session à 7 jours</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="p-3">Cookies de préférence</td>
                  <td className="p-3">1 an</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="p-3">Cookies analytiques</td>
                  <td className="p-3">26 mois maximum</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Modifications */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">Modifications de cette Politique</h2>
          <div className="text-neutral-600">
            <p>
              Cette politique peut être mise à jour pour refléter les évolutions de nos pratiques ou 
              des réglementations. Nous vous encourageons à la consulter régulièrement.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">Questions ?</h2>
          <div className="text-neutral-600">
            <p>Pour toute question sur notre utilisation des cookies :</p>
            <p className="mt-2"><strong>Email :</strong> <a href="mailto:privacy@lecrinvirtuel.com" className="text-amber-600 hover:text-amber-700 underline">privacy@lecrinvirtuel.com</a></p>
          </div>
        </section>

      </div>
    </div>
  );
}