import React from 'react';
import { Shield, Lock, Eye, Database, Mail, FileText } from 'lucide-react';
import SEO from '@/components/common/SEO';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <SEO title="Politique de Confidentialité" />
      
      <div className="mb-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
          <Shield className="w-8 h-8 text-purple-600" />
        </div>
        <h1 className="text-4xl font-serif text-neutral-900 mb-3">Politique de Confidentialité</h1>
        <p className="text-neutral-500">Dernière mise à jour : 22 janvier 2026</p>
      </div>

      <div className="prose prose-neutral max-w-none space-y-8">
        
        {/* Introduction */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Eye className="w-6 h-6 text-purple-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-3">Introduction</h2>
              <p className="text-neutral-600 leading-relaxed">
                L'Écrin Virtuel s'engage à protéger votre vie privée. Cette politique explique comment nous collectons, 
                utilisons et protégeons vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD).
              </p>
            </div>
          </div>
        </section>

        {/* Données Collectées */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Database className="w-6 h-6 text-purple-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-3">Données Collectées</h2>
              <div className="space-y-4 text-neutral-600">
                <div>
                  <h3 className="font-medium text-neutral-900 mb-2">Données d'identification</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Nom complet et adresse email (lors de l'inscription)</li>
                    <li>Informations de profil (photo, préférences de style)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-neutral-900 mb-2">Données d'utilisation</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Photos que vous téléchargez (parties du corps, bijoux, vêtements)</li>
                    <li>Créations et essayages virtuels générés</li>
                    <li>Historique de navigation et préférences</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-neutral-900 mb-2">Données de paiement</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Informations de transaction (montant, date)</li>
                    <li>Les données bancaires sont traitées de manière sécurisée par nos prestataires de paiement certifiés</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Utilisation des Données */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <FileText className="w-6 h-6 text-purple-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-3">Utilisation des Données</h2>
              <div className="text-neutral-600 space-y-3">
                <p>Nous utilisons vos données personnelles pour :</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Fournir nos services d'essayage virtuel et de stylisme IA</li>
                  <li>Personnaliser votre expérience utilisateur</li>
                  <li>Traiter vos commandes et abonnements</li>
                  <li>Vous envoyer des communications importantes sur votre compte</li>
                  <li>Améliorer nos services grâce à l'analyse d'utilisation</li>
                  <li>Assurer la sécurité de notre plateforme</li>
                </ul>
                <p className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  <strong className="text-amber-900">Important :</strong> Nous n'utilisons JAMAIS vos photos pour former 
                  nos modèles d'IA sans votre consentement explicite. Vos images restent privées.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sécurité */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Lock className="w-6 h-6 text-purple-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-3">Sécurité et Protection</h2>
              <div className="text-neutral-600 space-y-3">
                <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles :</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Chiffrement SSL/TLS pour toutes les communications</li>
                  <li>Stockage sécurisé sur des serveurs certifiés européens</li>
                  <li>Accès limité aux données par des employés autorisés uniquement</li>
                  <li>Audits de sécurité réguliers</li>
                  <li>Sauvegarde quotidienne de vos données</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Vos Droits */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Mail className="w-6 h-6 text-purple-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-3">Vos Droits RGPD</h2>
              <div className="text-neutral-600 space-y-3">
                <p>Conformément au RGPD, vous disposez des droits suivants :</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données personnelles</li>
                  <li><strong>Droit de rectification :</strong> Corriger vos données inexactes</li>
                  <li><strong>Droit à l'effacement :</strong> Supprimer vos données ("droit à l'oubli")</li>
                  <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</li>
                  <li><strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données</li>
                  <li><strong>Droit de limitation :</strong> Limiter l'utilisation de vos données</li>
                </ul>
                <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm">
                    <strong className="text-purple-900">Pour exercer vos droits :</strong><br />
                    Contactez-nous à <a href="mailto:privacy@lecrinvirtuel.com" className="text-purple-600 hover:text-purple-700 underline">privacy@lecrinvirtuel.com</a><br />
                    Nous répondons sous 30 jours maximum.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partage des Données */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">Partage des Données</h2>
          <div className="text-neutral-600 space-y-3">
            <p>Nous ne vendons jamais vos données personnelles. Nous pouvons les partager uniquement avec :</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Prestataires techniques :</strong> Hébergement (Supabase), IA (OpenAI), paiement</li>
              <li><strong>Partenaires commerciaux :</strong> Uniquement si vous achetez leurs produits</li>
              <li><strong>Autorités légales :</strong> En cas d'obligation légale</li>
            </ul>
            <p className="text-sm bg-neutral-50 rounded-lg p-3 mt-3">
              Tous nos sous-traitants sont conformes au RGPD et situés dans l'Union Européenne ou 
              bénéficient de garanties appropriées (clauses contractuelles types).
            </p>
          </div>
        </section>

        {/* Cookies */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">Cookies et Technologies Similaires</h2>
          <div className="text-neutral-600 space-y-3">
            <p>Nous utilisons des cookies essentiels pour le fonctionnement du site et des cookies analytiques 
            pour améliorer nos services. Vous pouvez gérer vos préférences à tout moment.</p>
            <p className="text-sm">
              Pour plus d'informations, consultez notre <a href="/CookiePolicy" className="text-purple-600 hover:text-purple-700 underline">Politique de Cookies</a>.
            </p>
          </div>
        </section>

        {/* Conservation des Données */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">Conservation des Données</h2>
          <div className="text-neutral-600 space-y-3">
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Données de compte : Conservées tant que votre compte est actif</li>
              <li>Photos et créations : Conservées jusqu'à suppression manuelle</li>
              <li>Données de paiement : 10 ans (obligation légale comptable)</li>
              <li>Données analytiques : 26 mois maximum</li>
            </ul>
            <p className="text-sm bg-neutral-50 rounded-lg p-3 mt-3">
              Après suppression de votre compte, vos données sont effacées sous 30 jours, 
              sauf obligations légales de conservation.
            </p>
          </div>
        </section>

        {/* Modifications */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">Modifications de cette Politique</h2>
          <div className="text-neutral-600">
            <p>
              Nous pouvons mettre à jour cette politique pour refléter les changements de nos pratiques ou 
              des réglementations. Nous vous informerons par email de tout changement significatif.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">Nous Contacter</h2>
          <div className="text-neutral-600 space-y-2">
            <p><strong>Responsable du traitement des données :</strong> L'Écrin Virtuel</p>
            <p><strong>Email :</strong> <a href="mailto:privacy@lecrinvirtuel.com" className="text-purple-600 hover:text-purple-700 underline">privacy@lecrinvirtuel.com</a></p>
            <p className="text-sm mt-4">
              Vous pouvez également contacter la CNIL (Commission Nationale de l'Informatique et des Libertés) 
              si vous estimez que vos droits ne sont pas respectés.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}