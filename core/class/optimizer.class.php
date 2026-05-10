<?php

require_once __DIR__ . '/../../../../core/php/core.inc.php';

class optimizer extends eqLogic
{
    const MODE_AUTO = 'auto';
    const MODE_MANUEL = 'manuel';
    const MODE_ABSENCE = 'absence';
    const MODE_NUIT = 'nuit';
    const MODE_CONFORT = 'confort';
    const MODE_ECO = 'eco';

    public static function cron5()
    {
        foreach (self::byType('optimizer', true) as $eqLogic) {
            if ($eqLogic->getIsEnable()) {
                $eqLogic->runRegulationCycle();
            }
        }
    }

    public function postSave()
    {
        $this->syncInternalCommands();
    }

    public function syncInternalCommands()
    {
        $defs = self::internalCommandDefinitions();
        foreach ($defs as $logicalId => $def) {
            $cmd = $this->getCmd(null, $logicalId);
            if (!is_object($cmd)) {
                $cmd = new optimizerCmd();
                $cmd->setLogicalId($logicalId);
                $cmd->setEqLogic_id($this->getId());
            }
            $cmd->setName($def['name']);
            $cmd->setType($def['type']);
            $cmd->setSubType($def['subType']);
            $cmd->setIsVisible(1);
            $cmd->setIsHistorized(isset($def['historize']) ? $def['historize'] : 0);
            $cmd->save();
        }
    }

    public static function internalCommandDefinitions()
    {
        return [
            'mode_calcule' => ['name' => 'Mode calculé', 'type' => 'info', 'subType' => 'string'],
            'confort_thermique' => ['name' => 'Confort thermique calculé', 'type' => 'info', 'subType' => 'numeric', 'historize' => 1],
            'besoin_chauffage' => ['name' => 'Besoin chauffage', 'type' => 'info', 'subType' => 'numeric', 'historize' => 1],
            'besoin_climatisation' => ['name' => 'Besoin climatisation', 'type' => 'info', 'subType' => 'numeric', 'historize' => 1],
            'besoin_ventilation' => ['name' => 'Besoin ventilation', 'type' => 'info', 'subType' => 'numeric', 'historize' => 1],
            'besoin_lumiere' => ['name' => 'Besoin lumière', 'type' => 'info', 'subType' => 'numeric', 'historize' => 1],
            'besoin_occultation' => ['name' => 'Besoin occultation solaire', 'type' => 'info', 'subType' => 'numeric'],
            'risque_surchauffe' => ['name' => 'Risque surchauffe', 'type' => 'info', 'subType' => 'binary'],
            'risque_humidite' => ['name' => 'Risque humidité', 'type' => 'info', 'subType' => 'binary'],
            'risque_air_vicie' => ['name' => 'Risque air vicié', 'type' => 'info', 'subType' => 'binary'],
            'score_confort_global' => ['name' => 'Score confort global', 'type' => 'info', 'subType' => 'numeric'],
            'score_economie_energie' => ['name' => 'Score économie énergie', 'type' => 'info', 'subType' => 'numeric'],
            'derniere_decision' => ['name' => 'Dernière décision', 'type' => 'info', 'subType' => 'string'],
            'raison_decision' => ['name' => 'Raison décision', 'type' => 'info', 'subType' => 'string'],
            'prochaine_action' => ['name' => 'Prochaine action prévue', 'type' => 'info', 'subType' => 'string'],
            'apprentissage_actif' => ['name' => 'Apprentissage actif', 'type' => 'info', 'subType' => 'binary'],
            'confiance_decision' => ['name' => 'Niveau de confiance', 'type' => 'info', 'subType' => 'numeric'],
            'refresh_analysis' => ['name' => 'Rafraîchir analyse', 'type' => 'action', 'subType' => 'other'],
            'apply_now' => ['name' => 'Appliquer régulation', 'type' => 'action', 'subType' => 'other'],
            'toggle_auto' => ['name' => 'Activer/Désactiver Auto', 'type' => 'action', 'subType' => 'other'],
            'toggle_learning' => ['name' => 'Activer/Désactiver apprentissage', 'type' => 'action', 'subType' => 'other'],
            'force_confort' => ['name' => 'Forcer Confort', 'type' => 'action', 'subType' => 'other'],
            'force_eco' => ['name' => 'Forcer Eco', 'type' => 'action', 'subType' => 'other'],
            'force_nuit' => ['name' => 'Forcer Nuit', 'type' => 'action', 'subType' => 'other'],
            'force_absence' => ['name' => 'Forcer Absence', 'type' => 'action', 'subType' => 'other'],
            'reset_learning' => ['name' => 'Réinitialiser apprentissage', 'type' => 'action', 'subType' => 'other'],
            'save_profile' => ['name' => 'Sauvegarder profil', 'type' => 'action', 'subType' => 'other'],
            'diagnostic_zone' => ['name' => 'Diagnostic zone', 'type' => 'action', 'subType' => 'other'],
            'diagnostic_global' => ['name' => 'Diagnostic global', 'type' => 'action', 'subType' => 'other']
        ];
    }

    public function runRegulationCycle()
    {
        $c = $this->buildContext();
        $d = $this->computeDecision($c);
        $this->applySafetyGuards($d, $c);
        $this->persistDecision($d, $c);
        if ($this->getConfiguration('mode', self::MODE_AUTO) === self::MODE_AUTO) {
            $this->executeDecision($d);
        }
    }

    private function buildContext()
    {
        $keys = ['temperature_interieure','hygrometrie_interieure','luminosite_interieure','presence','mouvement','fenetre','porte','temperature_exterieure','hygrometrie_exterieure','luminosite_exterieure','co2'];
        $ctx = [];
        foreach ($keys as $k) {
            $ctx[$k] = $this->valueFromMapping('info_' . $k);
        }
        $ctx['mode'] = $this->getConfiguration('mode', self::MODE_AUTO);
        return $ctx;
    }

    private function valueFromMapping($configKey)
    {
        $cmd = cmd::byId((int)$this->getConfiguration($configKey));
        return is_object($cmd) ? $cmd->execCmd() : null;
    }

    private function computeDecision($c)
    {
        $target = (float)$this->getConfiguration('target_temp', 20);
        $temp = (float)$c['temperature_interieure'];
        $delta = $target - $temp;
        $d = ['heating'=>0,'cooling'=>0,'ventilation'=>0,'lighting'=>0,'shading'=>0,'actions'=>[],'reason'=>'RAS'];
        if ($delta > 0.5) {$d['heating']=min(100,(int)($delta*25));$d['actions'][]='heat_on';$d['reason']='Température basse';}
        if ($delta < -0.5) {$d['cooling']=min(100,(int)(abs($delta)*25));$d['actions'][]='cool_on';$d['reason']='Température haute';}
        if ((int)$c['presence']===1 && (float)$c['luminosite_interieure'] < (float)$this->getConfiguration('min_lux',120)) {$d['lighting']=70;$d['actions'][]='light_on';}
        if ((float)$c['hygrometrie_interieure'] > (float)$this->getConfiguration('max_hygro',65) || (int)$c['co2'] > (int)$this->getConfiguration('max_co2',1000)) {$d['ventilation']=80;$d['actions'][]='vent_high';}
        if ((float)$c['temperature_exterieure'] > $target + 3 && (float)$c['luminosite_exterieure'] > 30000) {$d['shading']=80;$d['actions'][]='shutter_half';}
        return $d;
    }

    private function applySafetyGuards(&$d, $c)
    {
        if ((int)$c['fenetre'] === 1) {
            $d['heating'] = 0; $d['cooling'] = 0;
            $d['actions'] = array_values(array_diff($d['actions'], ['heat_on','cool_on']));
            $d['reason'] .= ' | Fenêtre ouverte';
        }
        if ($d['heating'] > 0 && $d['cooling'] > 0) {
            $d['cooling'] = 0;
            $d['actions'] = array_values(array_diff($d['actions'], ['cool_on']));
        }
    }

    private function persistDecision($d, $c)
    {
        $this->checkAndUpdateCmd('mode_calcule', $c['mode']);
        $this->checkAndUpdateCmd('besoin_chauffage', $d['heating']);
        $this->checkAndUpdateCmd('besoin_climatisation', $d['cooling']);
        $this->checkAndUpdateCmd('besoin_ventilation', $d['ventilation']);
        $this->checkAndUpdateCmd('besoin_lumiere', $d['lighting']);
        $this->checkAndUpdateCmd('besoin_occultation', $d['shading']);
        $this->checkAndUpdateCmd('risque_humidite', $d['ventilation'] > 0 ? 1 : 0);
        $this->checkAndUpdateCmd('risque_surchauffe', $d['cooling'] > 0 ? 1 : 0);
        $this->checkAndUpdateCmd('score_confort_global', max(0, 100 - abs((float)$this->getConfiguration('target_temp', 20) - (float)$c['temperature_interieure']) * 15));
        $this->checkAndUpdateCmd('derniere_decision', implode(',', $d['actions']));
        $this->checkAndUpdateCmd('raison_decision', $d['reason']);
        $this->checkAndUpdateCmd('apprentissage_actif', (int)$this->getConfiguration('learning_enabled', 0));
        $this->checkAndUpdateCmd('confiance_decision', 70);

        $history = $this->getConfiguration('history', []);
        if (!is_array($history)) {$history = [];}
        $history[] = ['ts' => time(), 'decision' => $d, 'context' => $c];
        $this->setConfiguration('history', array_slice($history, -500));
        $this->save(true);
        log::add('optimizer', 'info', $this->getHumanName() . ' => ' . $d['reason']);
    }

    private function executeDecision($d)
    {
        $map = ['heat_on'=>'action_chauffage_on','cool_on'=>'action_clim_on','vent_high'=>'action_ventilation_speed','light_on'=>'action_lumiere_on','shutter_half'=>'action_volet_position'];
        foreach ($d['actions'] as $a) {
            if (!isset($map[$a])) {continue;}
            $cmd = cmd::byId((int)$this->getConfiguration($map[$a]));
            if (!is_object($cmd)) {continue;}
            $options = [];
            if ($a === 'vent_high' || $a === 'shutter_half') {$options['slider'] = 80;}
            $cmd->execCmd($options);
        }
    }
}
