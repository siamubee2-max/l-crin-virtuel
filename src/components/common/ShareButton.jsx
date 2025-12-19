import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Share2, 
  Link as LinkIcon, 
  Twitter, 
  Facebook, 
  Mail, 
  Check 
} from "lucide-react";
import { useLanguage } from '@/components/LanguageProvider';

export default function ShareButton({ title, text, url, imageUrl, variant = "outline", size = "default", className }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const shareData = {
    title: title || "L'Écrin Virtuel",
    text: text || "Regardez ma création !",
    url: url || window.location.href,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareData.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openSocial = (network) => {
    let shareUrl = "";
    const encodedUrl = encodeURIComponent(shareData.url);
    const encodedText = encodeURIComponent(shareData.text);
    const encodedImage = imageUrl ? encodeURIComponent(imageUrl) : "";

    switch (network) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedText}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodedText}%20${encodedUrl}`;
        break;
      default:
        return;
    }
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  // If native share is available (mostly mobile), we can prioritize it or show it as an option
  // But often on desktop it's not available, so we show the dropdown.
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className={`w-4 h-4 ${children ? "mr-2" : ""}`} />
          {children}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t.common?.share || "Partager"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="w-4 h-4 mr-2" />
            {t.common?.share || "Partager..."}
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <LinkIcon className="w-4 h-4 mr-2" />}
          {copied ? (t.common?.linkCopied || "Copié !") : (t.common?.copyLink || "Copier le lien")}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => openSocial('twitter')}>
          <Twitter className="w-4 h-4 mr-2" /> Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openSocial('facebook')}>
          <Facebook className="w-4 h-4 mr-2" /> Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openSocial('pinterest')} disabled={!imageUrl}>
          <span className="w-4 h-4 mr-2 flex items-center justify-center font-bold text-xs bg-red-600 text-white rounded-full">P</span> Pinterest
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openSocial('email')}>
          <Mail className="w-4 h-4 mr-2" /> Email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper component to fix the children prop issue if I used it above without defining it in props
// Redefining proper props:
function ShareButtonWrapper({ children, ...props }) {
  return <ShareButton {...props}>{children}</ShareButton>;
}