<?php
if (!isConnect('admin')) {
    throw new Exception(__('401 - Accès non autorisé', __FILE__));
}

sendVarToJS('eqType', 'optimizer');

$globalMode = config::byKey('global_mode', 'optimizer', 'auto');
$targetComfort = config::byKey('target_comfort', 'optimizer', 21);
$nextActions = config::byKey('next_actions', 'optimizer', '[]');
?>

<div class="row row-overflow" id="optimizerContainer">
  <div class="col-lg-12">
    <legend><i class="fas fa-brain"></i> {{Optimizer}}</legend>
    <div class="pull-right" style="margin-top:-38px;">
      <a class="btn btn-default" id="bt_backPage"><i class="fas fa-arrow-left"></i> {{Retour}}</a>
      <a class="btn btn-success" id="bt_saveAll"><i class="fas fa-save"></i> {{Sauvegarder}}</a>
    </div>

    <ul class="nav nav-tabs" role="tablist">
      <li role="presentation" class="active"><a href="#opt_dashboard" aria-controls="opt_dashboard" role="tab" data-toggle="tab"><i class="fas fa-tachometer-alt"></i> {{Dashboard}}</a></li>
      <li role="presentation"><a href="#opt_global" aria-controls="opt_global" role="tab" data-toggle="tab"><i class="fas fa-cogs"></i> {{Configuration globale}}</a></li>
      <li role="presentation"><a href="#opt_zone" aria-controls="opt_zone" role="tab" data-toggle="tab"><i class="fas fa-map-marked-alt"></i> {{Configuration par zone}}</a></li>
      <li role="presentation"><a href="#opt_rules" aria-controls="opt_rules" role="tab" data-toggle="tab"><i class="fas fa-sliders-h"></i> {{Règles de régulation}}</a></li>
      <li role="presentation"><a href="#opt_learning" aria-controls="opt_learning" role="tab" data-toggle="tab"><i class="fas fa-graduation-cap"></i> {{Apprentissage}}</a></li>
      <li role="presentation"><a href="#opt_history" aria-controls="opt_history" role="tab" data-toggle="tab"><i class="fas fa-history"></i> {{Historique / décisions}}</a></li>
      <li role="presentation"><a href="#opt_diagnostic" aria-controls="opt_diagnostic" role="tab" data-toggle="tab"><i class="fas fa-stethoscope"></i> {{Diagnostic}}</a></li>
    </ul>

    <div class="tab-content" style="margin-top:12px;">
      <div role="tabpanel" class="tab-pane active" id="opt_dashboard">
        <div class="row">
          <div class="col-md-3"><div class="alert alert-info"><b>{{État global}}</b><br><span id="opt_state_global">{{OK}}</span></div></div>
          <div class="col-md-3"><div class="alert alert-success"><b>{{Mode}}</b><br><span id="opt_mode"><?php echo $globalMode; ?></span></div></div>
          <div class="col-md-3"><div class="alert alert-warning"><b>{{Confort cible}}</b><br><span id="opt_comfort"><?php echo $targetComfort; ?>°C</span></div></div>
          <div class="col-md-3"><div class="alert alert-primary"><b>{{Prochaines actions}}</b><br><span id="opt_next_actions"><?php echo htmlspecialchars($nextActions); ?></span></div></div>
        </div>
      </div>

      <div role="tabpanel" class="tab-pane" id="opt_global">
        <form class="form-horizontal">
          <div class="form-group">
            <label class="col-sm-3 control-label">{{Mode global}}</label>
            <div class="col-sm-4">
              <select class="form-control configKey" data-l1key="global_mode">
                <option value="auto">{{Auto}}</option>
                <option value="eco">{{Eco}}</option>
                <option value="confort">{{Confort}}</option>
                <option value="absence">{{Absence}}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="col-sm-3 control-label">{{Confort cible (°C)}}</label>
            <div class="col-sm-2"><input type="number" class="form-control configKey" data-l1key="target_comfort" min="15" max="28" step="0.5"></div>
          </div>
          <div class="form-group">
            <div class="col-sm-offset-3 col-sm-3"><a class="btn btn-success" id="bt_saveGlobal"><i class="fas fa-save"></i> {{Sauvegarder}}</a></div>
          </div>
        </form>
      </div>

      <div role="tabpanel" class="tab-pane" id="opt_zone">
        <div class="text-right" style="margin-bottom:8px;">
          <a class="btn btn-primary" id="bt_addZone"><i class="fas fa-plus-circle"></i> {{Ajouter une zone}}</a>
          <a class="btn btn-info" id="bt_refreshJeedomValues"><i class="fas fa-sync"></i> {{Récupérer les valeurs Jeedom}}</a>
        </div>
        <table class="table table-condensed" id="tableZones">
          <thead><tr><th>{{Zone}}</th><th>{{Données prises en compte}}</th><th>{{Actions}}</th></tr></thead>
          <tbody>
            <tr><td><input class="form-control zoneField" data-field="name" value="Salon"></td><td><div class="zoneParams">  <div class="form-inline" style="margin-bottom:4px;"><label><input type="checkbox" class="zoneField" data-field="use_temp_indoor" checked> Température intérieure (°C)</label> <input class="form-control cmdSelector zoneField" data-field="temp_indoor_cmd" data-subtype="info" style="width:55%;margin-left:8px;"></div>  <div class="form-inline" style="margin-bottom:4px;"><label><input type="checkbox" class="zoneField" data-field="use_hygro_indoor"> Hygrométrie intérieure (%)</label> <input class="form-control cmdSelector zoneField" data-field="hygro_indoor_cmd" data-subtype="info" style="width:55%;margin-left:8px;"></div>  <div class="form-inline" style="margin-bottom:4px;"><label><input type="checkbox" class="zoneField" data-field="use_lux_indoor"> Luminosité intérieure (lux)</label> <input class="form-control cmdSelector zoneField" data-field="lux_indoor_cmd" data-subtype="info" style="width:55%;margin-left:8px;"></div>  <div class="form-inline" style="margin-bottom:4px;"><label><input type="checkbox" class="zoneField" data-field="use_presence"> Présence / occupation</label> <input class="form-control cmdSelector zoneField" data-field="presence_cmd" data-subtype="info" style="width:55%;margin-left:8px;"></div>  <div class="form-inline" style="margin-bottom:4px;"><label><input type="checkbox" class="zoneField" data-field="use_motion"> Mouvement</label> <input class="form-control cmdSelector zoneField" data-field="motion_cmd" data-subtype="info" style="width:55%;margin-left:8px;"></div>  <div class="form-inline" style="margin-bottom:4px;"><label><input type="checkbox" class="zoneField" data-field="use_window"> État fenêtre</label> <input class="form-control cmdSelector zoneField" data-field="window_cmd" data-subtype="info" style="width:55%;margin-left:8px;"></div>  <div class="form-inline" style="margin-bottom:4px;"><label><input type="checkbox" class="zoneField" data-field="use_door"> État porte</label> <input class="form-control cmdSelector zoneField" data-field="door_cmd" data-subtype="info" style="width:55%;margin-left:8px;"></div>  <div class="form-inline" style="margin-bottom:4px;"><label><input type="checkbox" class="zoneField" data-field="use_setpoint" checked> Température de consigne (°C)</label> <input class="form-control cmdSelector zoneField" data-field="setpoint_cmd" data-subtype="info" style="width:55%;margin-left:8px;"></div>  <div class="form-inline" style="margin-bottom:4px;"><label><input type="checkbox" class="zoneField" data-field="use_heating_state"> État chauffage (Off/Chaud/Froid)</label> <input class="form-control cmdSelector zoneField" data-field="heating_state_cmd" data-subtype="info" style="width:55%;margin-left:8px;"></div>  <div class="form-inline" style="margin-bottom:4px;"><label><input type="checkbox" class="zoneField" data-field="use_shutter_state"> État volet (position %)</label> <input class="form-control cmdSelector zoneField" data-field="shutter_state_cmd" data-subtype="info" style="width:55%;margin-left:8px;"></div>  <div class="form-inline" style="margin-bottom:4px;"><label><input type="checkbox" class="zoneField" data-field="use_light_state"> État lumière (On/Off, intensité %)</label> <input class="form-control cmdSelector zoneField" data-field="light_state_cmd" data-subtype="info" style="width:55%;margin-left:8px;"></div>  <div class="form-inline" style="margin-bottom:4px;"><label><input type="checkbox" class="zoneField" data-field="use_co2"> Qualité air CO2</label> <input class="form-control cmdSelector zoneField" data-field="co2_cmd" data-subtype="info" style="width:55%;margin-left:8px;"></div></div></td><td><a class="btn btn-danger btn-xs bt_removeZone"><i class="fas fa-trash"></i> {{Supprimer}}</a></td></tr>
          </tbody>
        </table>
      </div>

      <div role="tabpanel" class="tab-pane" id="opt_rules"><div class="alert alert-info">{{Onglet règles de régulation (priorités, hystérésis, contraintes énergétiques).}}</div></div>
      <div role="tabpanel" class="tab-pane" id="opt_learning"><div class="alert alert-info">{{Onglet apprentissage (profil d’occupation, inertie thermique, habitudes).}}</div></div>
      <div role="tabpanel" class="tab-pane" id="opt_history"><div class="alert alert-info">{{Onglet historique/décisions (journal des arbitrages et actions envoyées).}}</div></div>
      <div role="tabpanel" class="tab-pane" id="opt_diagnostic"><div class="alert alert-info">{{Onglet diagnostic (cohérence capteurs, commandes manquantes, latence).}}</div></div>
    </div>
  </div>
</div>

<?php include_file('desktop', 'optimizer', 'js', 'optimizer'); ?>
