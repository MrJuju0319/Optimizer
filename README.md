# Optimizer (plugin Jeedom)

## ⚠️ Important : `Plugin introuvable : optimizer`

Sur Jeedom (Linux), le nom du dossier du plugin est **sensible à la casse**.
Le plugin doit être installé dans :

`/var/www/html/plugins/optimizer`

et **pas** dans `.../plugins/Optimizer`.

L'identifiant du plugin est `optimizer` (voir `plugin_info/info.json`), donc le dossier doit être strictement le même en minuscule.

## Structure de base

Ce dépôt contient la base template du plugin Jeedom `optimizer` :

- `plugin_info/info.json`
- `plugin_info/install.php`
- `core/class/optimizer.class.php`
- `core/ajax/optimizer.ajax.php`
- `core/php/jeeOptimizer.php`
- `desktop/php/optimizer.php`
- `desktop/js/optimizer.js`

## Vérification rapide

Depuis le serveur Jeedom :

```bash
ls -ld /var/www/html/plugins/optimizer
cat /var/www/html/plugins/optimizer/plugin_info/info.json
```

Si le dossier est `Optimizer`, renomme-le :

```bash
mv /var/www/html/plugins/Optimizer /var/www/html/plugins/optimizer
chown -R www-data:www-data /var/www/html/plugins/optimizer
```
