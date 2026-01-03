import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function SEO({ 
  title, 
  description, 
  image, 
  keywords = [],
  author = "L'Écrin Virtuel"
}) {
  const location = useLocation();
  
  useEffect(() => {
    const currentUrl = window.location.origin + location.pathname + location.search;
    const siteName = "L'Écrin Virtuel";
    const defaultDescription = "Découvrez L'Écrin Virtuel, votre destination luxe pour l'essayage de bijoux en réalité augmentée et le stylisme par IA.";
    const defaultImage = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6942ff9b2efb59336aebfa58/a0c7900de_ElegantLogowithAbstractGemIcon.png";

    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const metaDescription = description || defaultDescription;
    const metaImage = image || defaultImage;

    // Update Title
    document.title = fullTitle;

    // Helper to update meta tags
    const updateMeta = (selector, content, attrName = 'name', attrValue) => {
      if (!attrValue) attrValue = selector;
      
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard
    updateMeta('description', metaDescription);
    updateMeta('author', author);
    if (keywords.length > 0) updateMeta('keywords', keywords.join(', '));

    // Open Graph
    updateMeta('og:title', fullTitle, 'property', 'og:title');
    updateMeta('og:description', metaDescription, 'property', 'og:description');
    updateMeta('og:image', metaImage, 'property', 'og:image');
    updateMeta('og:url', currentUrl, 'property', 'og:url');
    updateMeta('og:type', 'website', 'property', 'og:type');

    // Twitter
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', metaDescription);
    updateMeta('twitter:image', metaImage);

  }, [title, description, image, keywords, author, location]);

  return null;
}