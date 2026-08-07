#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Construit le catalogue du NOUVEAU site DFC à partir :
  - des données produits déjà extraites de l'ancien site
    (../dieynissa-migration/data/products.json — source de vérité texte/prix) ;
  - des photos déjà présentes localement dans assets/Ancien site/<Catégorie>/
    (source de vérité images, PAS de nouveau téléchargement).

Sorties :
  - assets/data/products.js     (catalogue consommé par le site, vanilla JS)
  - assets/data/products.json   (même contenu, format JSON pur)
  - assets/data/categories.json (7 catégories obligatoires du nouveau site)
  - reports/catalog-migration.md
  - reports/catalog-audit.csv

Règle absolue : aucune donnée inventée. Un produit sans photo locale fiable reste
avec image = null et un statut MATCH_REVIEW_REQUIRED / IMAGE_MISSING.
"""
import json
import csv
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent          # .../DFC
MIGRATION_DATA = ROOT.parent / "dieynissa-migration" / "data" / "products.json"
ASSETS_OLD = ROOT / "assets" / "Ancien site"
DATA_OUT = ROOT / "assets" / "data"
REPORTS_OUT = ROOT / "reports"
DATA_OUT.mkdir(parents=True, exist_ok=True)
REPORTS_OUT.mkdir(parents=True, exist_ok=True)

OLD_SITE = "https://dieynissa-fashion-creation.com"

# --------------------------------------------------------------------------
# 1. Catégories obligatoires du nouveau site (= dossiers assets/Ancien site/)
#    Le nom affiché reprend le libellé du dossier (décision produit du client).
#    old_category_names permet la traçabilité avec la catégorie WooCommerce
#    d'origine (peut différer, cf. rapport).
# --------------------------------------------------------------------------
CATEGORIES = [
    {"slug": "accessoires",        "name": "Accessoires",         "folder": "Accessoires",
     "old_category_names": ["Accessoires"]},
    {"slug": "epicerie-ethnique",  "name": "Epicerie Ethnique",   "folder": "Epicerie Ethnique",
     "old_category_names": ["Epicerie éthnique"]},
    {"slug": "maison-decoration",  "name": "Maison et décoration","folder": "Maison et décoration",
     "old_category_names": ["Maison et décoration"]},
    {"slug": "mode",               "name": "Mode",                "folder": "Mode",
     "old_category_names": ["Mode"]},
    {"slug": "perruques",          "name": "Perruques",           "folder": "Perruques",
     "old_category_names": ["Perruques"]},
    {"slug": "secrets-de-femme",   "name": "Secrets de femme",    "folder": "Secrets de femme",
     "old_category_names": ["Secrets de Femmes"]},
    {"slug": "soins",              "name": "Soins",                "folder": "Soins",
     "old_category_names": ["Bien-être"]},
]
CATEGORY_BY_FOLDER = {c["folder"]: c for c in CATEGORIES}


def strip_accents(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def norm(s):
    return strip_accents(s or "").lower().replace("’", " ").replace("'", " ")


# --------------------------------------------------------------------------
# 2. Table de correspondance produit (ancien site) -> fichier image local
#    Construite manuellement à partir d'une vérification croisée :
#      - catégorie du dossier local (Soins = ancienne catégorie "Bien-être")
#      - nom du produit vs nom de fichier (tous les mots-clés significatifs
#        du nom produit se retrouvent dans le nom de fichier, dans le même ordre)
#      - cohérence du grammage (450G, 205G, 80G, 60G, 135G, 125G, 200G, 40G, 50G)
#    Chaque entrée est documentée avec sa confiance (1.0 = certain).
# --------------------------------------------------------------------------
IMAGE_MATCH = {
    # slug ancien site (source de vérité) : (fichier local dans "Soins", confidence, note)
    "beurre-de-cacao-450g":                    ("beurre-cacao-400G.png", 0.9,
        "Nom de fichier indique 400G alors que le titre produit indique 450G — écart de grammage à vérifier avec la cliente, mais correspondance produit non ambiguë (seul beurre de cacao du catalogue)."),
    "miel-de-nigelle-habba-saouda":             ("miel-nigelle-habba-saouda.png", 1.0,
        "Rangé par la cliente dans Soins alors que catégorisé 'Epicerie éthnique' sur l'ancien site — conservé dans Soins conformément au classement local (signal fort), catégorie d'origine tracée dans metadata."),
    "huile-de-coco-pur-450g":                   ("huile-pur-coco-450G.png", 1.0, ""),
    "beurre-de-karite":                         ("Beurre-karité.png", 1.0, ""),
    "detox-puissant-ancestral-au-khamare-80g":  ("detox-puissant-ancestral-khamaré-80G.png", 1.0, ""),
    "nigelle-degypte-habba-sawda":              ("Nigelle-egypte-habba-sawda.png", 1.0, ""),
    "tisane-mixe-de-khamare-vetiver":           ("tisane-mixe-khamaré-vétiver.png", 1.0, ""),
    "sakhe-sikhe-traitement-3-jours-60g":       ("sakhé-sikhé-traitement-3J-60G.png", 1.0, ""),
    "savon-au-curcuma-135g":                    ("savon-curcuma-135G.png", 1.0, ""),
    "savon-baobab-et-nigelle-125g":             ("savon-baobab-nigelle-125G.png", 1.0, ""),
    "poudre-khamare-explosif-grand-mere-205g-2":("poudre-khamaré-explosif-205G.png", 1.0, ""),
    "thiokho-poudre-de-souchet-205g-2":         ("thioko-poudre-souchet.png", 1.0, ""),
    "pommade-funegrec-200g":                    ("pommade-funegrec.png", 1.0,
        "Le titre produit orthographie 'FUNEGREC' (déjà présent ainsi sur l'ancien site) alors que la description parle de 'Fenugrec' — coquille d'origine conservée telle quelle (aucune réécriture commerciale)."),
    "106":                                      ("le-fruit-4-coté.png", 1.0,
        "Slug d'origine numérique ('106') sur l'ancien site — nom réel du produit : 'LE FRUIT 4 CÔTÉ / L’ÉSÉSE'."),
    "savon-noir-mou-du-nigeria":                ("savon-noir-mou-nigeria.png", 1.0, ""),
    "soin-pour-cheveux-au-chebe":                ("soin-cheveux-chébé.png", 1.0,
        "Produit en rupture de stock / non achetable sur l'ancien site (is_in_stock=false)."),
    "feuille-de-djeka-40g":                     ("feuille-djeka.png", 1.0, ""),
    "poudre-de-chebe":                          ("poudre-chébé.png", 1.0, ""),
    "savon-dudu-osum":                          ("savon-dudu-osum.png", 1.0, ""),
    "khamare-ou-vetiver":                       ("khamaré-vétiver.png", 1.0, ""),
    "le-sene-du-yemen-50g":                     ("séné-yemen.png", 1.0, ""),
    "thiokho-poudre-de-souchet-205g":           ("thioko-poudre-souchet.png", 1.0,
        "DOUBLON : même image et même produit que 'thiokho-poudre-de-souchet-205g-2' (ID différent, réimport WooCommerce)."),
    "poudre-khamare-explosif-grand-mere-205g":  ("poudre-khamaré-explosif-205G.png", 1.0,
        "DOUBLON : même image et même produit que 'poudre-khamare-explosif-grand-mere-205g-2' (ID différent, réimport WooCommerce)."),
    "khamare-nouroute-grand-mere":              ("khamaré-nourouté.png", 1.0, ""),
}

# Doublons à fusionner : on conserve l'ID le plus ancien (le plus petit) comme
# produit affiché sur le site, l'autre est marqué "merged_into" et exclu de
# l'affichage pour ne pas dupliquer la fiche produit (cf. consigne §8).
DUPLICATE_MERGE = {
    44: 113,    # THIOKHO POUDRE DE SOUCHET 205G : ID 44 fusionné dans 113
    42: 115,    # POUDRE KHAMARÉ EXPLOSIF GRAND MÈRE 205G : ID 42 fusionné dans 115
}


def main():
    raw = json.loads(MIGRATION_DATA.read_text(encoding="utf-8"))
    by_id = {p["id"]: p for p in raw}

    catalog = []
    audit_rows = []
    review_needed = []

    for p in raw:
        pid = p["id"]
        if pid in DUPLICATE_MERGE:
            continue  # fusionné, ne pas créer de fiche séparée

        slug = p["slug"]
        match = IMAGE_MATCH.get(slug)

        # catégorie : Soins par défaut (dossier local réel) sauf override
        new_cat = CATEGORY_BY_FOLDER["Soins"]

        local_image = None
        confidence = 0.0
        note = ""
        if match:
            fname, confidence, note = match
            candidate = ASSETS_OLD / "Soins" / fname
            if candidate.exists():
                local_image = f"assets/Ancien site/Soins/{fname}"
            else:
                confidence = 0.0
                note = f"MATCH_REVIEW_REQUIRED — fichier attendu introuvable : {fname}"

        status = "OK"
        problems = []
        if not p["price"]:
            problems.append("PRICE_MISSING")
        if not (p["description"] or p["short_description"]):
            problems.append("DESCRIPTION_MISSING")
        if not local_image:
            problems.append("IMAGE_MISSING")
            status = "MATCH_REVIEW_REQUIRED"
        elif confidence < 0.8:
            status = "MATCH_REVIEW_REQUIRED"

        if problems or status != "OK" or (note and confidence < 1.0):
            review_needed.append({
                "name": p["name"], "category": new_cat["name"], "price": p["price"],
                "image": local_image, "confidence": confidence,
                "old_url": p["old_url"],
                "problem": "; ".join(problems + ([note] if note and note not in problems else [])) or "confiance modérée",
            })

        merged_ids = [k for k, v in DUPLICATE_MERGE.items() if v == pid]

        catalog.append({
            "id": pid,
            "name": p["name"],
            "slug": slug,
            "category": {"name": new_cat["name"], "slug": new_cat["slug"]},
            "price": p["price"],
            "regularPrice": p["regular_price"],
            "salePrice": p["sale_price"],
            "currency": p["currency"],
            "shortDescription": p["short_description"],
            "description": p["description"],
            "images": {
                "main": local_image,
                "gallery": [],
            },
            "attributes": p["attributes"] or {},
            "variations": p["variations"] or [],
            "stockStatus": p["stock_status"],
            "oldUrl": p["old_url"],
            "migration": {
                "imageMatchConfidence": confidence,
                "verified": confidence >= 0.8 and local_image is not None,
                "oldCategory": p["category"],
                "mergedDuplicateIds": merged_ids or None,
                "note": note or None,
            },
        })

        audit_rows.append({
            "product_name": p["name"], "category": new_cat["name"], "price": p["price"] or "",
            "old_url": p["old_url"], "local_image": local_image or "",
            "gallery_count": 0,
            "description_found": "oui" if (p["description"] or p["short_description"]) else "non",
            "price_found": "oui" if p["price"] else "non",
            "image_found": "oui" if local_image else "non",
            "image_match_confidence": confidence,
            "status": status,
            "notes": note,
        })

    # tri par catégorie puis nom pour un affichage stable
    catalog.sort(key=lambda r: (r["category"]["slug"], r["name"]))

    # --------------------------------------------------------------------
    # écriture des fichiers de données consommés par le site
    # --------------------------------------------------------------------
    (DATA_OUT / "products.json").write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")

    categories_with_counts = []
    for c in CATEGORIES:
        count = sum(1 for p in catalog if p["category"]["slug"] == c["slug"])
        categories_with_counts.append({**c, "productCount": count})
    (DATA_OUT / "categories.json").write_text(
        json.dumps(categories_with_counts, ensure_ascii=False, indent=2), encoding="utf-8")

    js_content = (
        "// Catalogue DFC — généré à partir de l'ancien site + assets/Ancien site/\n"
        "// Ne pas éditer les prix/descriptions manuellement : relancer scripts/build_catalog.py\n"
        "// (source de vérité : dieynissa-migration/data/products.json)\n"
        f"const DFC_CATEGORIES = {json.dumps(categories_with_counts, ensure_ascii=False, indent=2)};\n\n"
        f"const DFC_PRODUCTS = {json.dumps(catalog, ensure_ascii=False, indent=2)};\n"
    )
    (DATA_OUT / "products.js").write_text(js_content, encoding="utf-8")

    # --------------------------------------------------------------------
    # reports/catalog-audit.csv
    # --------------------------------------------------------------------
    fields = ["product_name", "category", "price", "old_url", "local_image", "gallery_count",
              "description_found", "price_found", "image_found", "image_match_confidence",
              "status", "notes"]
    with open(REPORTS_OUT / "catalog-audit.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for row in audit_rows:
            w.writerow(row)

    # --------------------------------------------------------------------
    # reports/catalog-migration.md
    # --------------------------------------------------------------------
    total_old_products = len(raw)
    total_integrated = len(catalog)
    total_local_images = sum(
        len(list((ASSETS_OLD / c["folder"]).glob("*"))) for c in CATEGORIES
        if (ASSETS_OLD / c["folder"]).exists()
    )
    with_image = sum(1 for p in catalog if p["images"]["main"])
    without_image = total_integrated - with_image
    high_conf = sum(1 for p in catalog if p["migration"]["imageMatchConfidence"] >= 0.95)
    mid_conf = sum(1 for p in catalog if 0.6 <= p["migration"]["imageMatchConfidence"] < 0.95)
    low_conf = sum(1 for p in catalog if 0 < p["migration"]["imageMatchConfidence"] < 0.6)

    by_cat_lines = []
    for c in CATEGORIES:
        folder_path = ASSETS_OLD / c["folder"]
        n_images = len(list(folder_path.glob("*"))) if folder_path.exists() else 0
        n_products = sum(1 for p in catalog if p["category"]["slug"] == c["slug"])
        by_cat_lines.append(
            f"### {c['name']}\n- Produits intégrés : {n_products}\n"
            f"- Images locales disponibles : {n_images}\n"
            f"- Ancienne(s) catégorie(s) WooCommerce correspondante(s) : "
            f"{', '.join(c['old_category_names']) or '—'}\n"
        )

    review_lines = []
    for r in review_needed:
        review_lines.append(
            f"**{r['name']}**\n"
            f"- Catégorie : {r['category']}\n"
            f"- Prix : {r['price'] if r['price'] is not None else 'N/A'}\n"
            f"- Image candidate : {r['image'] or 'aucune'}\n"
            f"- Confidence : {r['confidence']}\n"
            f"- Ancienne URL : {r['old_url']}\n"
            f"- Problème : {r['problem']}\n"
        )

    report = f"""# Résumé

- Nombre de catégories (obligatoires, dossiers assets/Ancien site/) : {len(CATEGORIES)}
- Nombre de produits trouvés sur l'ancien site : {total_old_products}
- Nombre de produits intégrés au nouveau site (après fusion des doublons) : {total_integrated}
- Nombre d'images locales disponibles (tous dossiers) : {total_local_images}
- Produits avec image trouvée : {with_image}
- Produits sans image : {without_image}
- Matching haute confiance (≥0.95) : {high_conf}
- Matching moyenne confiance (0.6–0.95) : {mid_conf}
- Matching faible confiance (<0.6) : {low_conf}
- Doublons fusionnés : {len(DUPLICATE_MERGE)} (IDs {list(DUPLICATE_MERGE.keys())} fusionnés dans {list(DUPLICATE_MERGE.values())})

# Par catégorie

{chr(10).join(by_cat_lines)}

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

{chr(10).join(review_lines) if review_lines else "Aucun — tous les produits intégrés ont une image, un prix et une description avec une confiance ≥ 0.9."}
"""
    (REPORTS_OUT / "catalog-migration.md").write_text(report, encoding="utf-8")

    print(f"Produits intégrés : {total_integrated} / {total_old_products} (bruts)")
    print(f"Avec image : {with_image} | Sans image : {without_image}")
    print(f"Confiance haute/moyenne/faible : {high_conf}/{mid_conf}/{low_conf}")


if __name__ == "__main__":
    main()
