<?php

/* This file is part of Jeedom.
 *
 * Jeedom is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

require_once __DIR__ . '/../../../../core/php/core.inc.php';

class optimizer extends eqLogic
{
    public static function cron()
    {
        // Point d'entrée pour les optimisations planifiées.
    }

    public static function cron5()
    {
        // Prévu pour les calculs fréquents d'optimisation.
    }

    public static function cron15()
    {
        // Prévu pour des optimisations énergétiques moins fréquentes.
    }

    public static function cronHourly()
    {
        // Prévu pour des ajustements macro selon météo / occupation.
    }

    public function preInsert()
    {
    }

    public function postInsert()
    {
    }

    public function preSave()
    {
    }

    public function postSave()
    {
    }

    public function preUpdate()
    {
    }

    public function postUpdate()
    {
    }

    public function preRemove()
    {
    }

    public function postRemove()
    {
    }
}

class optimizerCmd extends cmd
{
    public function execute($_options = array())
    {
        $this->setIsHistorized(0);
        return;
    }
}
