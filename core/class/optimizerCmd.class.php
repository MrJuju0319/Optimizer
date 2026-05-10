<?php

require_once __DIR__ . '/../../../../core/php/core.inc.php';

class optimizerCmd extends cmd
{
    public function execute($_options = [])
    {
        $eqLogic = $this->getEqLogic();
        if (!is_object($eqLogic)) {
            throw new Exception(__('EqLogic introuvable', __FILE__));
        }

        switch ($this->getLogicalId()) {
            case 'refresh_analysis':
            case 'apply_now':
                $eqLogic->runRegulationCycle();
                return;
            case 'toggle_auto':
                $mode = $eqLogic->getConfiguration('mode', optimizer::MODE_AUTO) === optimizer::MODE_AUTO ? optimizer::MODE_MANUEL : optimizer::MODE_AUTO;
                $eqLogic->setConfiguration('mode', $mode);
                $eqLogic->save(true);
                return;
            case 'force_confort':
                $eqLogic->setConfiguration('mode', optimizer::MODE_CONFORT);
                $eqLogic->save(true);
                return;
            case 'force_eco':
                $eqLogic->setConfiguration('mode', optimizer::MODE_ECO);
                $eqLogic->save(true);
                return;
            case 'force_nuit':
                $eqLogic->setConfiguration('mode', optimizer::MODE_NUIT);
                $eqLogic->save(true);
                return;
            case 'force_absence':
                $eqLogic->setConfiguration('mode', optimizer::MODE_ABSENCE);
                $eqLogic->save(true);
                return;
            case 'toggle_learning':
                $current = (int)$eqLogic->getConfiguration('learning_enabled', 0);
                $eqLogic->setConfiguration('learning_enabled', $current ? 0 : 1);
                $eqLogic->save(true);
                return;
            case 'reset_learning':
                $eqLogic->setConfiguration('history', []);
                $eqLogic->save(true);
                return;
            case 'diagnostic_zone':
            case 'diagnostic_global':
                log::add('optimizer', 'info', 'Diagnostic demandé: ' . $eqLogic->getHumanName() . ' (' . $this->getLogicalId() . ')');
                return;
            default:
                return;
        }
    }
}
