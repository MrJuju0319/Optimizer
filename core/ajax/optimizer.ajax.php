<?php

require_once __DIR__ . '/../../../../core/php/core.inc.php';
include_file('core', 'authentification', 'php');

if (!isConnect('admin')) {
    throw new Exception(__('401 - Accès non autorisé', __FILE__));
}

ajax::init();

try {
    if (init('action') == 'health') {
        ajax::success(array('status' => 'ok', 'plugin' => 'optimizer'));
    }

    throw new Exception(__('Aucune méthode correspondante à : ', __FILE__) . init('action'));
} catch (Exception $e) {
    ajax::error(displayException($e), $e->getCode());
}
