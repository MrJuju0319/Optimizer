<?php
/* This file is part of Jeedom.
 *
 * Plugin Optimizer entrypoint for ajax/hooks if needed.
 */
if (!isConnect()) {
    throw new Exception(__('401 - Accès non autorisé', __FILE__));
}
