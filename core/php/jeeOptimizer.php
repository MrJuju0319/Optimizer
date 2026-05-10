<?php

require_once __DIR__ . '/../../../../core/php/core.inc.php';

function optimizer_install()
{
    log::add('optimizer', 'info', 'Installation du plugin Optimizer');
}

function optimizer_update()
{
    log::add('optimizer', 'info', 'Mise à jour du plugin Optimizer');
}

function optimizer_remove()
{
    log::add('optimizer', 'info', 'Suppression du plugin Optimizer');
}
