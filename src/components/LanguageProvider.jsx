import React, { createContext, useState, useContext } from 'react';

const translations = {
  fr: {
    nav: {
      gallery: "Galerie",
      studio: "L'Atelier",
      wardrobe: "Ma Bibliothèque",
      closet: "Mon Dressing",
      jewelryBox: "Mon Écrin"
      },
    common: {
      footer: "L'Écrin Virtuel © 2024 — Luxe & Technologie",
      loading: "Chargement...",
      save: "Enregistrer",
      saving: "Enregistrement...",
      delete: "Supprimer",
      download: "Télécharger",
      next: "Suivant",
      back: "Retour",
      cancel: "Annuler",
      upload: "Téléchargement...",
      clickToUpload: "Cliquez pour importer",
      orTakePhoto: "ou prenez-en une maintenant",
      change: "Changer"
    },
    wardrobe: {
      title: "Ma Bibliothèque",
      subtitle: "Gérez votre collection de parties du corps pour vos essayages virtuels. Prenez des photos claires et bien éclairées.",
      addPhoto: "Ajouter une photo",
      newPhoto: "Nouvelle photo",
      nameLabel: "Nom (ex: Mon profil droit)",
      namePlaceholder: "Nom de la photo...",
      typeLabel: "Partie du corps",
      photoLabel: "Photo",
      emptyTitle: "Votre bibliothèque est vide",
      emptyText: "Commencez par ajouter une photo de vous.",
      types: {
        face: "Visage",
        neck: "Cou & Décolleté",
        bust_with_hands: "Buste avec Mains",
        left_ear_profile: "Oreille Gauche",
        right_ear_profile: "Oreille Droite",
        left_wrist: "Poignet Gauche",
        right_wrist: "Poignet Droit",
        left_hand: "Main Gauche",
        right_hand: "Main Droite",
        left_ankle: "Cheville Gauche",
        right_ankle: "Cheville Droite"
      }
    },
    studio: {
      title: "L'Atelier de Création",
      subtitle: "Essayez virtuellement n'importe quel bijou en quelques secondes grâce à l'IA.",
      arMode: "Mode Miroir AR",
      steps: {
        upload: "Le Bijou",
        selectBody: "Le Modèle",
        generate: "La Magie",
        result: "Le Résultat"
      },
      newTry: "Nouvel Essai",
      step1: {
        title: "Choisissez le bijou",
        desc: "Importez une photo depuis une boutique en ligne ou prenez-la en photo.",
        typeLabel: "Type de bijou",
        types: {
          earrings: "Boucles d'oreilles",
          necklace: "Collier / Pendentif",
          ring: "Bague",
          bracelet: "Bracelet",
          anklet: "Bracelet de cheville",
          set: "Parure Complète"
        }
      },
      step2: {
        title: "Sur qui on essaye ?",
        desc: "Sélectionnez une photo compatible depuis votre bibliothèque.",
        empty: "Aucune photo compatible trouvée dans votre bibliothèque.",
        goToWardrobe: "Aller à la bibliothèque",
        notesLabel: "Instructions spéciales (Optionnel)",
        notesPlaceholder: "Ex: Le bijou est très petit, gardez les proportions...",
        generateBtn: "Générer l'Essayage",
        or: "OU",
        tryLive: "Essayer en Direct (Webcam)"
        },
        ar: {
        title: "Miroir Virtuel",
        desc: "Ajustez le bijou sur votre image. Déplacez, agrandissez et pivotez pour un rendu parfait.",
        startCamera: "Activer la Caméra",
        stopCamera: "Arrêter",
        flipCamera: "Changer de caméra",
        takePhoto: "Prendre une photo",
        size: "Taille",
        rotation: "Rotation",
        back: "Retour au Studio",
        permissionDenied: "Accès caméra refusé. Vérifiez vos paramètres."
        },
      step3: {
        title: "Création de la magie...",
        desc: "L'IA ajuste la lumière, les ombres et la perspective pour un rendu parfait."
      },
      step4: {
        title: "C'est prêt !",
        desc: "Voici votre essayage virtuel.",
        goToGallery: "Aller à la Galerie"
      }
    },
    gallery: {
      hero: {
        title: "Essayez l'inaccessible.",
        subtitle: "Virtuellement.",
        desc: "Importez un bijou, choisissez votre photo, et laissez la magie opérer. Visualisez le résultat avant d'acheter ou juste pour rêver.",
        cta: "Nouvel Essayage"
      },
      myCreations: "Mes Créations",
      latestTryons: "Vos derniers essayages virtuels.",
      empty: "Vous n'avez pas encore fait d'essayages.",
      createFirst: "Créer mon premier look",
      sort: "Trier par",
      filter: "Filtrer",
      newest: "Plus récents",
      oldest: "Plus anciens",
      loadMore: "Voir plus",
      bodyPart: "Sur : "
      },
      stylist: {
        title: "Styliste IA",
        analyzeBtn: "Demander conseil au Styliste",
        analyzing: "Analyse de style en cours...",
        suggestions: "Suggestions de Style",
        advice: "Couleurs & Occasions",
        compatible: "Compléter le Look"
      },
      jewelryBox: {
        title: "Mon Écrin",
        subtitle: "Cataloguez vos bijoux précieux. L'IA vous aidera à les organiser et à trouver des correspondances.",
        addBtn: "Ajouter un bijou",
        newItem: "Nouveau Bijou",
        searchPlaceholder: "Rechercher (or, argent, Cartier...)",
        analyzing: "L'IA analyse votre bijou...",
        fields: {
          name: "Nom",
          type: "Type",
          brand: "Marque",
          material: "Matière",
          desc: "Description",
          tags: "Tags détectés"
        },
        empty: "Votre écrin est vide.",
        emptyCta: "Ajoutez votre premier trésor."
        },
        closet: {
        title: "Mon Dressing",
        subtitle: "Gérez vos vêtements et créez des looks parfaits avec vos bijoux.",
        addBtn: "Ajouter un vêtement",
        newItem: "Nouveau Vêtement",
        searchPlaceholder: "Rechercher (robe rouge, chemise soie...)",
        aiMatch: "Styliste IA",
        aiMatchDesc: "L'IA vous suggère les meilleurs bijoux pour cette tenue.",
        types: {
          top: "Haut",
          bottom: "Bas",
          dress: "Robe",
          outerwear: "Veste/Manteau",
          shoes: "Chaussures",
          bag: "Sac",
          accessory: "Accessoire"
        },
        fields: {
          name: "Nom",
          type: "Catégorie",
          brand: "Marque",
          color: "Couleur",
          material: "Matière",
          matchJewelry: "Associer des bijoux"
        },
        ai: {
          btn: "Suggérer un look",
          promptLabel: "Pour quelle occasion ?",
          promptPlaceholder: "Ex: Un mariage chic en été, une réunion professionnelle...",
          resultTitle: "Suggestion du Styliste",
          why: "Pourquoi ce choix :",
          modeOutfit: "Compléter ma tenue",
          modeJewelry: "Assortir un bijou",
          selectJewel: "Choisissez le bijou vedette",
          selectClothes: "Sélectionnez vos vêtements",
          selection: "sélectionnés",
          clear: "Effacer"
        }
        }
        },
  en: {
    nav: {
      gallery: "Gallery",
      studio: "The Studio",
      wardrobe: "My Wardrobe",
      closet: "My Closet",
      jewelryBox: "My Jewelry Box"
      },
    common: {
      footer: "The Virtual Jewelry Box © 2024 — Luxury & Technology",
      loading: "Loading...",
      save: "Save",
      saving: "Saving...",
      delete: "Delete",
      download: "Download",
      next: "Next",
      back: "Back",
      cancel: "Cancel",
      upload: "Uploading...",
      clickToUpload: "Click to upload",
      orTakePhoto: "or take one now",
      change: "Change"
    },
    wardrobe: {
      title: "My Wardrobe",
      subtitle: "Manage your collection of body parts for virtual try-ons. Take clear, well-lit photos.",
      addPhoto: "Add a photo",
      newPhoto: "New photo",
      nameLabel: "Name (e.g., My right profile)",
      namePlaceholder: "Photo name...",
      typeLabel: "Body Part",
      photoLabel: "Photo",
      emptyTitle: "Your wardrobe is empty",
      emptyText: "Start by adding a photo of yourself.",
      types: {
        face: "Face",
        neck: "Neck & Décolletage",
        bust_with_hands: "Bust with Hands",
        left_ear_profile: "Left Ear",
        right_ear_profile: "Right Ear",
        left_wrist: "Left Wrist",
        right_wrist: "Right Wrist",
        left_hand: "Left Hand",
        right_hand: "Right Hand",
        left_ankle: "Left Ankle",
        right_ankle: "Right Ankle"
      }
    },
    studio: {
      title: "Creative Studio",
      subtitle: "Virtually try on any jewelry in seconds using AI.",
      arMode: "AR Mirror Mode",
      steps: {
        upload: "The Jewelry",
        selectBody: "The Model",
        generate: "Magic",
        result: "Result"
      },
      newTry: "New Try",
      step1: {
        title: "Choose the jewelry",
        desc: "Import a photo from an online store or take a picture.",
        typeLabel: "Jewelry Type",
        types: {
          earrings: "Earrings",
          necklace: "Necklace / Pendant",
          ring: "Ring",
          bracelet: "Bracelet",
          anklet: "Anklet",
          set: "Full Set"
        }
      },
      step2: {
        title: "Who is trying it on?",
        desc: "Select a compatible photo from your library.",
        empty: "No compatible photo found in your library.",
        goToWardrobe: "Go to library",
        notesLabel: "Special Instructions (Optional)",
        notesPlaceholder: "E.g.: The jewelry is very small, keep proportions...",
        generateBtn: "Generate Try-On",
        or: "OR",
        tryLive: "Try Live (Webcam)"
        },
        ar: {
        title: "Virtual Mirror",
        desc: "Adjust the jewelry on your image. Move, resize, and rotate for the perfect look.",
        startCamera: "Start Camera",
        stopCamera: "Stop",
        flipCamera: "Flip Camera",
        takePhoto: "Take Photo",
        size: "Size",
        rotation: "Rotation",
        back: "Back to Studio",
        permissionDenied: "Camera access denied. Check your settings."
        },
      step3: {
        title: "Creating magic...",
        desc: "AI is adjusting light, shadows, and perspective for a perfect render."
      },
      step4: {
        title: "It's ready!",
        desc: "Here is your virtual try-on.",
        goToGallery: "Go to Gallery"
      }
    },
    gallery: {
      hero: {
        title: "Try the unreachable.",
        subtitle: "Virtually.",
        desc: "Import jewelry, choose your photo, and let the magic happen. Visualize the result before buying or just to dream.",
        cta: "New Try-On"
      },
      myCreations: "My Creations",
      latestTryons: "Your latest virtual try-ons.",
      empty: "You haven't made any try-ons yet.",
      createFirst: "Create my first look",
      sort: "Sort by",
      filter: "Filter",
      newest: "Newest",
      oldest: "Oldest",
      loadMore: "Load More",
      bodyPart: "On: "
      },
    stylist: {
      title: "AI Stylist",
      analyzeBtn: "Ask the Stylist",
      analyzing: "Analyzing style...",
      suggestions: "Styling Suggestions",
      advice: "Color & Occasion",
      compatible: "Complete the Look"
    }
    },
  es: {
    nav: {
      gallery: "Galería",
      studio: "El Taller",
      wardrobe: "Mi Armario",
      closet: "Mi Vestidor",
      jewelryBox: "Mi Joyero"
      },
    common: {
      footer: "El Joyero Virtual © 2024 — Lujo y Tecnología",
      loading: "Cargando...",
      save: "Guardar",
      saving: "Guardando...",
      delete: "Eliminar",
      download: "Descargar",
      next: "Siguiente",
      back: "Volver",
      cancel: "Cancelar",
      upload: "Subiendo...",
      clickToUpload: "Haz clic para subir",
      orTakePhoto: "o toma una ahora",
      change: "Cambiar"
    },
    wardrobe: {
      title: "Mi Armario",
      subtitle: "Gestiona tu colección de partes del cuerpo para pruebas virtuales. Toma fotos claras y bien iluminadas.",
      addPhoto: "Añadir foto",
      newPhoto: "Nueva foto",
      nameLabel: "Nombre (ej: Mi perfil derecho)",
      namePlaceholder: "Nombre de la foto...",
      typeLabel: "Parte del cuerpo",
      photoLabel: "Foto",
      emptyTitle: "Tu armario está vacío",
      emptyText: "Empieza añadiendo una foto tuya.",
      types: {
        face: "Cara",
        neck: "Cuello y Escote",
        bust_with_hands: "Busto con Manos",
        left_ear_profile: "Oreja Izquierda",
        right_ear_profile: "Oreja Derecha",
        left_wrist: "Muñeca Izquierda",
        right_wrist: "Muñeca Derecha",
        left_hand: "Mano Izquierda",
        right_hand: "Mano Derecha",
        left_ankle: "Tobillo Izquierdo",
        right_ankle: "Tobillo Derecho"
      }
    },
    studio: {
      title: "Taller Creativo",
      subtitle: "Prueba virtualmente cualquier joya en segundos usando IA.",
      arMode: "Modo Espejo AR",
      steps: {
        upload: "La Joya",
        selectBody: "El Modelo",
        generate: "Magia",
        result: "Resultado"
      },
      newTry: "Nuevo Intento",
      step1: {
        title: "Elige la joya",
        desc: "Importa una foto de una tienda online o toma una foto.",
        typeLabel: "Tipo de joya",
        types: {
          earrings: "Pendientes",
          necklace: "Collar / Colgante",
          ring: "Anillo",
          bracelet: "Pulsera",
          anklet: "Tobillera",
          set: "Conjunto Completo"
        }
      },
      step2: {
        title: "¿Quién se lo prueba?",
        desc: "Selecciona una foto compatible de tu biblioteca.",
        empty: "No se encontraron fotos compatibles en tu biblioteca.",
        goToWardrobe: "Ir a la biblioteca",
        notesLabel: "Instrucciones especiales (Opcional)",
        notesPlaceholder: "Ej: La joya es muy pequeña, mantener proporciones...",
        generateBtn: "Generar Prueba",
        or: "O",
        tryLive: "Prueba en Vivo (Webcam)"
        },
        ar: {
        title: "Espejo Virtual",
        desc: "Ajusta la joya en tu imagen. Mueve, cambia el tamaño y gira para un look perfecto.",
        startCamera: "Iniciar Cámara",
        stopCamera: "Detener",
        flipCamera: "Cambiar Cámara",
        takePhoto: "Tomar Foto",
        size: "Tamaño",
        rotation: "Rotación",
        back: "Volver al Taller",
        permissionDenied: "Acceso a la cámara denegado."
        },
      step3: {
        title: "Creando magia...",
        desc: "La IA ajusta la luz, las sombras y la perspectiva para un renderizado perfecto."
      },
      step4: {
        title: "¡Está listo!",
        desc: "Aquí tienes tu prueba virtual.",
        goToGallery: "Ir a la Galería"
      }
    },
    gallery: {
      hero: {
        title: "Prueba lo inalcanzable.",
        subtitle: "Virtualmente.",
        desc: "Importa una joya, elige tu foto y deja que ocurra la magia. Visualiza el resultado antes de comprar o simplemente para soñar.",
        cta: "Nueva Prueba"
      },
      myCreations: "Mis Creaciones",
      latestTryons: "Tus últimas pruebas virtuales.",
      empty: "Aún no has hecho ninguna prueba.",
      createFirst: "Crear mi primer look",
      sort: "Ordenar por",
      filter: "Filtrar",
      newest: "Más recientes",
      oldest: "Más antiguos",
      loadMore: "Cargar más",
      bodyPart: "En: "
      },
    stylist: {
      title: "Estilista IA",
      analyzeBtn: "Preguntar al Estilista",
      analyzing: "Analizando estilo...",
      suggestions: "Sugerencias de Estilo",
      advice: "Color y Ocasión",
      compatible: "Completar el Look"
    }
    },
  de: {
    nav: {
      gallery: "Galerie",
      studio: "Das Atelier",
      wardrobe: "Meine Garderobe",
      closet: "Mein Kleiderschrank",
      jewelryBox: "Mein Schmuckkästchen"
      },
    common: {
      footer: "Das Virtuelle Schmuckkästchen © 2024 — Luxus & Technologie",
      loading: "Laden...",
      save: "Speichern",
      saving: "Speichern...",
      delete: "Löschen",
      download: "Herunterladen",
      next: "Weiter",
      back: "Zurück",
      cancel: "Abbrechen",
      upload: "Hochladen...",
      clickToUpload: "Klicken zum Hochladen",
      orTakePhoto: "oder jetzt aufnehmen",
      change: "Ändern"
    },
    wardrobe: {
      title: "Meine Garderobe",
      subtitle: "Verwalten Sie Ihre Körperteilsammlung für virtuelle Anproben. Machen Sie klare, gut beleuchtete Fotos.",
      addPhoto: "Foto hinzufügen",
      newPhoto: "Neues Foto",
      nameLabel: "Name (z.B.: Mein rechtes Profil)",
      namePlaceholder: "Fotoname...",
      typeLabel: "Körperteil",
      photoLabel: "Foto",
      emptyTitle: "Ihre Garderobe ist leer",
      emptyText: "Beginnen Sie damit, ein Foto von sich hinzuzufügen.",
      types: {
        face: "Gesicht",
        neck: "Hals & Dekolleté",
        bust_with_hands: "Büste mit Händen",
        left_ear_profile: "Linkes Ohr",
        right_ear_profile: "Rechtes Ohr",
        left_wrist: "Linkes Handgelenk",
        right_wrist: "Rechtes Handgelenk",
        left_hand: "Linke Hand",
        right_hand: "Rechte Hand",
        left_ankle: "Linker Knöchel",
        right_ankle: "Rechter Knöchel"
      }
    },
    studio: {
      title: "Kreativ-Atelier",
      subtitle: "Probieren Sie jeden Schmuck virtuell in Sekunden mit KI an.",
      arMode: "AR-Spiegelmodus",
      steps: {
        upload: "Der Schmuck",
        selectBody: "Das Model",
        generate: "Magie",
        result: "Ergebnis"
      },
      newTry: "Neuer Versuch",
      step1: {
        title: "Wählen Sie den Schmuck",
        desc: "Importieren Sie ein Foto aus einem Online-Shop oder machen Sie ein Foto.",
        typeLabel: "Schmuckart",
        types: {
          earrings: "Ohrringe",
          necklace: "Halskette / Anhänger",
          ring: "Ring",
          bracelet: "Armband",
          anklet: "Fußkettchen",
          set: "Komplettes Set"
        }
      },
      step2: {
        title: "Wer probiert es an?",
        desc: "Wählen Sie ein kompatibles Foto aus Ihrer Bibliothek.",
        empty: "Kein kompatibles Foto in Ihrer Bibliothek gefunden.",
        goToWardrobe: "Zur Bibliothek gehen",
        notesLabel: "Besondere Anweisungen (Optional)",
        notesPlaceholder: "z.B.: Der Schmuck ist sehr klein, Proportionen beibehalten...",
        generateBtn: "Anprobe Generieren",
        or: "ODER",
        tryLive: "Live-Anprobe (Webcam)"
        },
        ar: {
        title: "Virtueller Spiegel",
        desc: "Passen Sie den Schmuck an. Bewegen, skalieren und drehen Sie für den perfekten Look.",
        startCamera: "Kamera Starten",
        stopCamera: "Stopp",
        flipCamera: "Kamera Wechseln",
        takePhoto: "Foto Aufnehmen",
        size: "Größe",
        rotation: "Rotation",
        back: "Zurück zum Atelier",
        permissionDenied: "Kamerazugriff verweigert."
        },
      step3: {
        title: "Magie wird erstellt...",
        desc: "Die KI passt Licht, Schatten und Perspektive für ein perfektes Rendering an."
      },
      step4: {
        title: "Es ist fertig!",
        desc: "Hier ist Ihre virtuelle Anprobe.",
        goToGallery: "Zur Galerie"
      }
    },
    gallery: {
      hero: {
        title: "Probieren Sie das Unerreichbare.",
        subtitle: "Virtuell.",
        desc: "Importieren Sie Schmuck, wählen Sie Ihr Foto und lassen Sie die Magie geschehen. Visualisieren Sie das Ergebnis vor dem Kauf oder einfach zum Träumen.",
        cta: "Neue Anprobe"
      },
      myCreations: "Meine Kreationen",
      latestTryons: "Ihre neuesten virtuellen Anproben.",
      empty: "Sie haben noch keine Anproben gemacht.",
      createFirst: "Meinen ersten Look erstellen",
      sort: "Sortieren nach",
      filter: "Filtern",
      newest: "Neueste",
      oldest: "Älteste",
      loadMore: "Mehr laden",
      bodyPart: "Auf: "
      },
    stylist: {
      title: "KI-Stylist",
      analyzeBtn: "Den Stylisten fragen",
      analyzing: "Stilanalyse...",
      suggestions: "Styling-Vorschläge",
      advice: "Farbe & Anlass",
      compatible: "Den Look vervollständigen"
    }
    },
  it: {
    nav: {
      gallery: "Galleria",
      studio: "L'Atelier",
      wardrobe: "Il Mio Guardaroba",
      closet: "Il Mio Armadio",
      jewelryBox: "Il Mio Scrigno"
      },
    common: {
      footer: "Lo Scrigno Virtuale © 2024 — Lusso & Tecnologia",
      loading: "Caricamento...",
      save: "Salva",
      saving: "Salvataggio...",
      delete: "Elimina",
      download: "Scarica",
      next: "Avanti",
      back: "Indietro",
      cancel: "Annulla",
      upload: "Caricamento...",
      clickToUpload: "Clicca per caricare",
      orTakePhoto: "o scatta ora",
      change: "Cambia"
    },
    wardrobe: {
      title: "Il Mio Guardaroba",
      subtitle: "Gestisci la tua collezione di parti del corpo per le prove virtuali. Scatta foto chiare e ben illuminate.",
      addPhoto: "Aggiungi foto",
      newPhoto: "Nuova foto",
      nameLabel: "Nome (es: Il mio profilo destro)",
      namePlaceholder: "Nome della foto...",
      typeLabel: "Parte del corpo",
      photoLabel: "Foto",
      emptyTitle: "Il tuo guardaroba è vuoto",
      emptyText: "Inizia aggiungendo una tua foto.",
      types: {
        face: "Viso",
        neck: "Collo & Décolleté",
        bust_with_hands: "Busto con Mani",
        left_ear_profile: "Orecchio Sinistro",
        right_ear_profile: "Orecchio Destro",
        left_wrist: "Polso Sinistro",
        right_wrist: "Polso Destro",
        left_hand: "Mano Sinistra",
        right_hand: "Mano Destra",
        left_ankle: "Caviglia Sinistra",
        right_ankle: "Caviglia Destra"
      }
    },
    studio: {
      title: "Atelier Creativo",
      subtitle: "Prova virtualmente qualsiasi gioiello in pochi secondi usando l'IA.",
      arMode: "Modalità Specchio AR",
      steps: {
        upload: "Il Gioiello",
        selectBody: "Il Modello",
        generate: "Magia",
        result: "Risultato"
      },
      newTry: "Nuova Prova",
      step1: {
        title: "Scegli il gioiello",
        desc: "Importa una foto da un negozio online o scatta una foto.",
        typeLabel: "Tipo di gioiello",
        types: {
          earrings: "Orecchini",
          necklace: "Collana / Pendente",
          ring: "Anello",
          bracelet: "Bracciale",
          anklet: "Cavigliera",
          set: "Set Completo"
        }
      },
      step2: {
        title: "Chi lo prova?",
        desc: "Seleziona una foto compatibile dalla tua biblioteca.",
        empty: "Nessuna foto compatibile trovata nella tua biblioteca.",
        goToWardrobe: "Vai alla biblioteca",
        notesLabel: "Istruzioni speciali (Opzionale)",
        notesPlaceholder: "Es: Il gioiello è molto piccolo, mantieni le proporzioni...",
        generateBtn: "Genera Prova",
        or: "OPPURE",
        tryLive: "Prova dal Vivo (Webcam)"
        },
        ar: {
        title: "Specchio Virtuale",
        desc: "Regola il gioiello sulla tua immagine. Sposta, ridimensiona e ruota per un look perfetto.",
        startCamera: "Avvia Fotocamera",
        stopCamera: "Stop",
        flipCamera: "Cambia Fotocamera",
        takePhoto: "Scatta Foto",
        size: "Dimensione",
        rotation: "Rotazione",
        back: "Torna all'Atelier",
        permissionDenied: "Accesso alla fotocamera negato."
        },
      step3: {
        title: "Creazione della magia...",
        desc: "L'IA regola luce, ombre e prospettiva per una resa perfetta."
      },
      step4: {
        title: "È pronto!",
        desc: "Ecco la tua prova virtuale.",
        goToGallery: "Vai alla Galleria"
      }
    },
    gallery: {
      hero: {
        title: "Prova l'irraggiungibile.",
        subtitle: "Virtualmente.",
        desc: "Importa un gioiello, scegli la tua foto e lascia che la magia accada. Visualizza il risultato prima di acquistare o solo per sognare.",
        cta: "Nuova Prova"
      },
      myCreations: "Le Mie Creazioni",
      latestTryons: "Le tue ultime prove virtuali.",
      empty: "Non hai ancora fatto prove.",
      createFirst: "Crea il mio primo look",
      sort: "Ordina per",
      filter: "Filtra",
      newest: "Più recenti",
      oldest: "Più vecchi",
      loadMore: "Carica altro",
      bodyPart: "Su: "
      },
    stylist: {
      title: "Stilista IA",
      analyzeBtn: "Chiedi allo Stilista",
      analyzing: "Analisi dello stile...",
      suggestions: "Suggerimenti di Stile",
      advice: "Colore e Occasione",
      compatible: "Completa il Look"
    }
    },
  pt: {
    nav: {
      gallery: "Galeria",
      studio: "O Estúdio",
      wardrobe: "Meu Guarda-Roupa",
      closet: "Meu Vestuário",
      jewelryBox: "Meu Porta-Joias"
      },
    common: {
      footer: "O Porta-Joias Virtual © 2024 — Luxo & Tecnologia",
      loading: "Carregando...",
      save: "Salvar",
      saving: "Salvando...",
      delete: "Excluir",
      download: "Baixar",
      next: "Próximo",
      back: "Voltar",
      cancel: "Cancelar",
      upload: "Carregando...",
      clickToUpload: "Clique para enviar",
      orTakePhoto: "ou tire uma agora",
      change: "Alterar"
    },
    wardrobe: {
      title: "Meu Guarda-Roupa",
      subtitle: "Gerencie sua coleção de partes do corpo para provas virtuais. Tire fotos claras e bem iluminadas.",
      addPhoto: "Adicionar foto",
      newPhoto: "Nova foto",
      nameLabel: "Nome (ex: Meu perfil direito)",
      namePlaceholder: "Nome da foto...",
      typeLabel: "Parte do corpo",
      photoLabel: "Foto",
      emptyTitle: "Seu guarda-roupa está vazio",
      emptyText: "Comece adicionando uma foto sua.",
      types: {
        face: "Rosto",
        neck: "Pescoço & Decote",
        bust_with_hands: "Busto com Mãos",
        left_ear_profile: "Orelha Esquerda",
        right_ear_profile: "Orelha Direita",
        left_wrist: "Pulso Esquerdo",
        right_wrist: "Pulso Direito",
        left_hand: "Mão Esquerda",
        right_hand: "Mão Direita",
        left_ankle: "Tornozelo Esquerdo",
        right_ankle: "Tornozelo Direito"
      }
    },
    studio: {
      title: "Estúdio Criativo",
      subtitle: "Experimente virtualmente qualquer joia em segundos usando IA.",
      arMode: "Modo Espelho AR",
      steps: {
        upload: "A Joia",
        selectBody: "O Modelo",
        generate: "Magia",
        result: "Resultado"
      },
      newTry: "Nova Tentativa",
      step1: {
        title: "Escolha a joia",
        desc: "Importe uma foto de uma loja online ou tire uma foto.",
        typeLabel: "Tipo de joia",
        types: {
          earrings: "Brincos",
          necklace: "Colar / Pingente",
          ring: "Anel",
          bracelet: "Pulseira",
          anklet: "Tornozeleira",
          set: "Conjunto Completo"
        }
      },
      step2: {
        title: "Quem vai provar?",
        desc: "Selecione uma foto compatível da sua biblioteca.",
        empty: "Nenhuma foto compatível encontrada na sua biblioteca.",
        goToWardrobe: "Ir para a biblioteca",
        notesLabel: "Instruções especiais (Opcional)",
        notesPlaceholder: "Ex: A joia é muito pequena, mantenha as proporções...",
        generateBtn: "Gerar Prova",
        or: "OU",
        tryLive: "Prova ao Vivo (Webcam)"
        },
        ar: {
        title: "Espelho Virtual",
        desc: "Ajuste a joia na sua imagem. Mova, redimensione e gire para um visual perfeito.",
        startCamera: "Iniciar Câmera",
        stopCamera: "Parar",
        flipCamera: "Inverter Câmera",
        takePhoto: "Tirar Foto",
        size: "Tamanho",
        rotation: "Rotação",
        back: "Voltar ao Estúdio",
        permissionDenied: "Acesso à câmera negado."
        },
      step3: {
        title: "Criando magia...",
        desc: "A IA ajusta luz, sombras e perspectiva para uma renderização perfeita."
      },
      step4: {
        title: "Está pronto!",
        desc: "Aqui está sua prova virtual.",
        goToGallery: "Ir para a Galeria"
      }
    },
    gallery: {
      hero: {
        title: "Experimente o inalcançável.",
        subtitle: "Virtualmente.",
        desc: "Importe uma joia, escolha sua foto e deixe a magia acontecer. Visualize o resultado antes de comprar ou apenas para sonhar.",
        cta: "Nova Prova"
      },
      myCreations: "Minhas Criações",
      latestTryons: "Suas últimas provas virtuais.",
      empty: "Você ainda não fez nenhuma prova.",
      createFirst: "Criar meu primeiro look",
      sort: "Ordenar por",
      filter: "Filtrar",
      newest: "Mais recentes",
      oldest: "Mais antigos",
      loadMore: "Carregar mais",
      bodyPart: "Em: "
      },
    stylist: {
      title: "Estilista IA",
      analyzeBtn: "Perguntar ao Estilista",
      analyzing: "Analisando estilo...",
      suggestions: "Sugestões de Estilo",
      advice: "Cor e Ocasião",
      compatible: "Completar o Look"
    }
    }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('fr');

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);