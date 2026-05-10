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

    if (init('action') == 'saveConfig') {
        $payload = json_decode(init('payload', '{}'), true);
        if (!is_array($payload)) {
            throw new Exception(__('Payload de configuration invalide', __FILE__));
        }
        foreach ($payload as $key => $value) {
            config::save($key, $value, 'optimizer');
        }
        ajax::success(array('saved' => true));
    }

    if (init('action') == 'loadConfig') {
        $keys = json_decode(init('keys', '[]'), true);
        if (!is_array($keys)) {
            throw new Exception(__('Liste de clés invalide', __FILE__));
        }
        $result = array();
        foreach ($keys as $key) {
            $result[$key] = config::byKey($key, 'optimizer', '');
        }
        ajax::success($result);
    }

    throw new Exception(__('Aucune méthode correspondante à : ', __FILE__) . init('action'));
} catch (Exception $e) {
    ajax::error(displayException($e), $e->getCode());
}
