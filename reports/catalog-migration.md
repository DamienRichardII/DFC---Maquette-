# Résumé

- Nombre de catégories (obligatoires, dossiers assets/Ancien site/) : 7
- Nombre de produits trouvés sur l'ancien site : 24
- Nombre de produits intégrés au nouveau site (après fusion des doublons) : 22
- Nombre d'images locales disponibles (tous dossiers) : 23
- Produits avec image trouvée : 22
- Produits sans image : 0
- Matching haute confiance (≥0.95) : 21
- Matching moyenne confiance (0.6–0.95) : 1
- Matching faible confiance (<0.6) : 0
- Doublons fusionnés : 2 (IDs [44, 42] fusionnés dans [113, 115])

# Par catégorie

### Accessoires
- Produits intégrés : 0
- Images locales disponibles : 0
- Ancienne(s) catégorie(s) WooCommerce correspondante(s) : Accessoires

### Epicerie Ethnique
- Produits intégrés : 0
- Images locales disponibles : 0
- Ancienne(s) catégorie(s) WooCommerce correspondante(s) : Epicerie éthnique

### Maison et décoration
- Produits intégrés : 0
- Images locales disponibles : 0
- Ancienne(s) catégorie(s) WooCommerce correspondante(s) : Maison et décoration

### Mode
- Produits intégrés : 0
- Images locales disponibles : 0
- Ancienne(s) catégorie(s) WooCommerce correspondante(s) : Mode

### Perruques
- Produits intégrés : 0
- Images locales disponibles : 0
- Ancienne(s) catégorie(s) WooCommerce correspondante(s) : Perruques

### Secrets de femme
- Produits intégrés : 0
- Images locales disponibles : 1
- Ancienne(s) catégorie(s) WooCommerce correspondante(s) : Secrets de Femmes

### Soins
- Produits intégrés : 22
- Images locales disponibles : 22
- Ancienne(s) catégorie(s) WooCommerce correspondante(s) : Bien-être


# ⚠️ Constat important

Le catalogue de l'ancien site (WooCommerce) ne contient **aucun produit publié** dans les
catégories Accessoires, Epicerie Ethnique (hors 1 produit reclassé dans Soins par la
cliente), Maison et décoration, Mode et Perruques : ces 5 catégories existent comme
structure de navigation côté ancien site mais sont vides de produits, et aucun fichier
image n'a été déposé dans les dossiers locaux correspondants. Elles sont donc créées sur
le nouveau site en tant que **catégories de navigation actives mais actuellement sans
produit** (état "Bientôt disponible"), conformément à la consigne de ne rien inventer.
Seule la catégorie **Soins** (ex-« Bien-être ») est aujourd'hui alimentée avec de vrais
produits de l'ancien site.

Le dossier **Secrets de femme** contient une photo (`WhatsApp Image 2026-08-03 at
15.08.04.jpeg`) qui ne correspond à aucun produit identifiable sur l'ancien site
(nom de fichier générique, date récente incompatible avec les uploads 2024 de l'ancien
site). Elle n'a donc pas été associée à un produit — à qualifier manuellement.

# Produits nécessitant une vérification

**BEURRE DE CACAO 450G**
- Catégorie : Soins
- Prix : 16.0
- Image candidate : assets/Ancien site/Soins/beurre-cacao-400G.png
- Confidence : 0.9
- Ancienne URL : https://dieynissa-fashion-creation.com/produit/beurre-de-cacao-450g/
- Problème : Nom de fichier indique 400G alors que le titre produit indique 450G — écart de grammage à vérifier avec la cliente, mais correspondance produit non ambiguë (seul beurre de cacao du catalogue).

**SOIN POUR CHEVEUX AU CHÉBÉ**
- Catégorie : Soins
- Prix : 0.0
- Image candidate : assets/Ancien site/Soins/soin-cheveux-chébé.png
- Confidence : 1.0
- Ancienne URL : https://dieynissa-fashion-creation.com/produit/soin-pour-cheveux-au-chebe/
- Problème : PRICE_MISSING; Produit en rupture de stock / non achetable sur l'ancien site (is_in_stock=false).

