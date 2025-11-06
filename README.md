# vintedBackend2025
Projet Vinted Clone

Présentation
Application Node.js / Express qui reproduit les fonctionnalités essentielles de Vinted : publication d’annonces, recherche filtrée et gestion des utilisateurs.

Fonctionnalités principales

Création d’une offre avec image téléversée (Cloudinary).
Consultation des annonces avec filtres (title, priceMin, priceMax, sort, page).
Détail complet d’une annonce via GET /offers/:id.
Modification et suppression sécurisées des offres (middleware isAuthenticated).
Stack technique

Backend : Node.js, Express, MongoDB, Mongoose.
Stockage d’images : Cloudinary.
Authentification : JSON Web Token.
Routes importantes

POST /offer/publish               # publier une annonce (auth requise)
GET  /offers                      # lister les annonces avec filtres + pagination
GET  /offers/:id                  # récupérer le détail d’une annonce
PUT  /offer/:id                   # mettre à jour une annonce (auth requise)
DELETE /offer/:id                 # supprimer une annonce (auth requise)
Démarrage rapide
