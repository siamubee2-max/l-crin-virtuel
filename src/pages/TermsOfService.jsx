import React from 'react';
import { FileText, AlertTriangle, CheckCircle, Ban, Scale } from 'lucide-react';
import SEO from '@/components/common/SEO';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <SEO title="Conditions Générales d'Utilisation" />
      
      <div className="mb-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
          <Scale className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-serif text-neutral-900 mb-3">Conditions Générales d'Utilisation</h1>
        <p className="text-neutral-500">En vigueur au 22 janvier 2026</p>
      </div>

      <div className="prose prose-neutral max-w-none space-y-8">
        
        {/* Acceptation */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-3">1. Acceptation des Conditions</h2>
              <div className="text-neutral-600 space-y-3">
                <p>
                  En accédant et en utilisant L'Écrin Virtuel, vous acceptez d'être lié par les présentes 
                  Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
                </p>
                <p className="text-sm bg-blue-50 rounded-lg p-3 border border-blue-100">
                  Ces CGU constituent un contrat légalement contraignant entre vous et L'Écrin Virtuel.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Description du Service */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <FileText className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-3">2. Description du Service</h2>
              <div className="text-neutral-600 space-y-3">
                <p>L'Écrin Virtuel propose :</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Un service d'essayage virtuel de bijoux et vêtements par intelligence artificielle</li>
                  <li>Une bibliothèque personnelle pour stocker vos photos et créations</li>
                  <li>Un catalogue de produits partenaires avec liens d'affiliation</li>
                  <li>Des services de stylisme IA et conseils personnalisés</li>
                  <li>Des fonctionnalités premium via abonnement (actuellement indisponible)</li>
                </ul>
                <p className="text-sm mt-3 bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <strong className="text-amber-900">Avertissement :</strong> Les essayages virtuels sont des simulations 
                  générées par IA à titre indicatif. Les résultats peuvent varier selon la qualité des photos fournies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Compte Utilisateur */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">3. Compte Utilisateur</h2>
          <div className="text-neutral-600 space-y-3">
            <h3 className="font-medium text-neutral-900">Création de compte</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Vous devez avoir au moins 16 ans pour créer un compte</li>
              <li>Les informations fournies doivent être exactes et à jour</li>
              <li>Vous êtes responsable de la confidentialité de votre mot de passe</li>
              <li>Un seul compte par personne est autorisé</li>
            </ul>
            
            <h3 className="font-medium text-neutral-900 mt-4">Sécurité du compte</h3>
            <p>Vous vous engagez à :</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Ne pas partager vos identifiants</li>
              <li>Nous informer immédiatement de toute utilisation non autorisée</li>
              <li>Utiliser un mot de passe sécurisé</li>
            </ul>
          </div>
        </section>

        {/* Utilisation du Service */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Ban className="w-6 h-6 text-red-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-3">4. Utilisation Autorisée</h2>
              <div className="text-neutral-600 space-y-3">
                <p><strong className="text-neutral-900">Vous êtes autorisé à :</strong></p>
                <ul className="list-disc list-inside space-y-2 ml-2 text-green-700">
                  <li>Utiliser nos services pour un usage personnel et non commercial</li>
                  <li>Télécharger vos propres photos</li>
                  <li>Partager vos créations sur les réseaux sociaux avec mention de notre marque</li>
                </ul>

                <p className="mt-4"><strong className="text-neutral-900">Vous n'êtes PAS autorisé à :</strong></p>
                <ul className="list-disc list-inside space-y-2 ml-2 text-red-700">
                  <li>Télécharger des photos de personnes sans leur consentement</li>
                  <li>Utiliser le service pour créer des contenus illégaux, diffamatoires ou offensants</li>
                  <li>Tenter de contourner les mesures de sécurité</li>
                  <li>Copier, modifier ou distribuer notre technologie d'IA</li>
                  <li>Utiliser des bots ou automatiser l'utilisation du service</li>
                  <li>Revendre ou redistribuer nos services</li>
                  <li>Uploader des images protégées par des droits d'auteur tiers</li>
                </ul>

                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-900">
                    <strong>Sanction :</strong> Toute violation de ces conditions peut entraîner la suspension 
                    ou la suppression définitive de votre compte sans préavis ni remboursement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contenu Utilisateur */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">5. Contenu Utilisateur</h2>
          <div className="text-neutral-600 space-y-3">
            <h3 className="font-medium text-neutral-900">Vos droits</h3>
            <p>
              Vous conservez tous les droits de propriété intellectuelle sur vos photos et créations. 
              En utilisant notre service, vous nous accordez une licence limitée pour :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Traiter vos images via notre technologie IA</li>
              <li>Stocker vos contenus sur nos serveurs</li>
              <li>Afficher vos créations dans votre compte</li>
            </ul>

            <h3 className="font-medium text-neutral-900 mt-4">Vos responsabilités</h3>
            <p>Vous garantissez que :</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Vous détenez les droits sur toutes les photos téléchargées</li>
              <li>Les personnes apparaissant sur les photos ont donné leur consentement</li>
              <li>Votre contenu ne viole aucune loi ou droit de tiers</li>
            </ul>
          </div>
        </section>

        {/* Propriété Intellectuelle */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">6. Propriété Intellectuelle</h2>
          <div className="text-neutral-600 space-y-3">
            <p>
              L'Écrin Virtuel, son logo, sa technologie, son design et tous les éléments du site sont 
              protégés par des droits de propriété intellectuelle. Toute reproduction non autorisée est interdite.
            </p>
            <p className="text-sm bg-neutral-50 rounded-lg p-3">
              Les marques et produits des partenaires commerciaux appartiennent à leurs propriétaires respectifs.
            </p>
          </div>
        </section>

        {/* Paiements et Abonnements */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">7. Paiements et Abonnements</h2>
          <div className="text-neutral-600 space-y-3">
            <h3 className="font-medium text-neutral-900">Tarification</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Les prix sont indiqués en euros TTC</li>
              <li>Nous nous réservons le droit de modifier les tarifs avec un préavis de 30 jours</li>
              <li>Les tarifs en cours au moment de la souscription restent applicables pendant la durée de l'abonnement</li>
            </ul>

            <h3 className="font-medium text-neutral-900 mt-4">Achats via partenaires</h3>
            <p>
              Lorsque vous achetez des produits via nos liens partenaires, la transaction est réalisée directement 
              avec le vendeur. Nous ne sommes pas responsables de la qualité, livraison ou SAV de ces produits.
            </p>

            <h3 className="font-medium text-neutral-900 mt-4">Droit de rétractation</h3>
            <p>
              Conformément au droit européen, vous disposez d'un délai de 14 jours pour vous rétracter 
              d'un achat d'abonnement sans justification.
            </p>
          </div>
        </section>

        {/* Limitation de Responsabilité */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-3">8. Limitation de Responsabilité</h2>
              <div className="text-neutral-600 space-y-3">
                <p>L'Écrin Virtuel ne peut être tenu responsable de :</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>L'exactitude des simulations d'essayage virtuel</li>
                  <li>Les décisions d'achat prises sur la base de nos visualisations</li>
                  <li>La qualité, conformité ou livraison des produits partenaires</li>
                  <li>Les interruptions temporaires du service pour maintenance</li>
                  <li>Les pertes de données dues à des circonstances hors de notre contrôle</li>
                  <li>L'utilisation abusive de notre service par des tiers</li>
                </ul>
                <p className="text-sm bg-amber-50 rounded-lg p-3 border border-amber-200 mt-3">
                  Notre responsabilité est limitée au montant payé pour le service au cours des 12 derniers mois.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Résiliation */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">9. Résiliation</h2>
          <div className="text-neutral-600 space-y-3">
            <h3 className="font-medium text-neutral-900">Par vous</h3>
            <p>Vous pouvez supprimer votre compte à tout moment depuis les paramètres.</p>

            <h3 className="font-medium text-neutral-900 mt-4">Par nous</h3>
            <p>Nous pouvons suspendre ou résilier votre compte en cas de :</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Violation de ces CGU</li>
              <li>Activité frauduleuse ou illégale</li>
              <li>Non-paiement d'un abonnement</li>
              <li>Inactivité prolongée (plus de 2 ans)</li>
            </ul>
          </div>
        </section>

        {/* Modifications */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">10. Modifications des CGU</h2>
          <div className="text-neutral-600">
            <p>
              Nous pouvons modifier ces conditions à tout moment. Les modifications substantielles 
              vous seront notifiées par email 30 jours avant leur entrée en vigueur. 
              Votre utilisation continue du service après cette période vaut acceptation des nouvelles conditions.
            </p>
          </div>
        </section>

        {/* Droit Applicable */}
        <section className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">11. Droit Applicable et Résolution des Litiges</h2>
          <div className="text-neutral-600 space-y-4">
            
            {/* Pour utilisateurs UE */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium text-neutral-900 mb-2">🇪🇺 Utilisateurs de l'Union Européenne</h3>
              <p>
                Les présentes CGU sont régies par le droit français. Tout litige relève de la compétence 
                des tribunaux français.
              </p>
              <p className="text-sm mt-2">
                Vous pouvez également recourir à la plateforme de règlement des litiges en ligne : 
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline ml-1">
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
            </div>

            {/* Pour utilisateurs US */}
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-medium text-neutral-900 mb-2">🇺🇸 Utilisateurs des États-Unis</h3>
              
              <p className="mb-3">
                <strong>Arbitrage contraignant :</strong> Tout litige sera résolu par arbitrage individuel 
                contraignant plutôt que par action en justice, sauf si vous choisissez de vous désengager 
                (opt-out) dans les 30 jours suivant votre inscription.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm space-y-2">
                <p><strong className="text-amber-900">Renonciation aux recours collectifs :</strong></p>
                <p>
                  Vous acceptez de renoncer à tout droit de participer à une action collective (class action) 
                  ou à une action de groupe contre L'Écrin Virtuel. Tous les litiges doivent être résolus 
                  sur une base individuelle.
                </p>
                <p className="mt-2">
                  <strong>Pour vous désengager (opt-out) :</strong> Envoyez un email à 
                  <a href="mailto:legal@lecrinvirtuel.com" className="text-amber-700 underline ml-1">legal@lecrinvirtuel.com</a> 
                  dans les 30 jours avec mention "Opt-out of Arbitration".
                </p>
              </div>

              <p className="text-sm mt-3">
                <strong>Droit applicable :</strong> Lois de l'État de Californie (sans égard aux règles de conflit de lois)<br />
                <strong>Forum :</strong> American Arbitration Association (AAA) selon les règles d'arbitrage commercial
              </p>
            </div>

            {/* Exception petites créances */}
            <div className="text-sm bg-neutral-50 rounded-lg p-3 mt-3">
              <strong>Exception :</strong> Les litiges de faible montant (&lt; 10 000 €/$ US) peuvent être portés 
              devant un tribunal des petites créances dans votre juridiction locale.
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <h2 className="text-xl font-serif text-neutral-900 mb-3">Contact</h2>
          <div className="text-neutral-600 space-y-2">
            <p>Pour toute question concernant ces CGU :</p>
            <p><strong>Email :</strong> <a href="mailto:legal@lecrinvirtuel.com" className="text-blue-600 hover:text-blue-700 underline">legal@lecrinvirtuel.com</a></p>
          </div>
        </section>

      </div>
    </div>
  );
}