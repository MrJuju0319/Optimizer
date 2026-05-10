(function () {
  const mappings = [
    ['info_temperature_interieure', 'Température intérieure', 'info'],
    ['info_hygrometrie_interieure', 'Hygrométrie intérieure', 'info'],
    ['info_luminosite_interieure', 'Luminosité intérieure', 'info'],
    ['info_presence', 'Présence', 'info'],
    ['info_mouvement', 'Mouvement', 'info'],
    ['info_fenetre', 'Fenêtre', 'info'],
    ['info_porte', 'Porte', 'info'],
    ['info_temperature_exterieure', 'Température extérieure', 'info'],
    ['info_hygrometrie_exterieure', 'Hygrométrie extérieure', 'info'],
    ['info_luminosite_exterieure', 'Luminosité extérieure', 'info'],
    ['info_co2', 'CO2', 'info'],
    ['action_lumiere_on', 'Allumer lumière', 'action'],
    ['action_volet_position', 'Position volet %', 'action'],
    ['action_chauffage_on', 'Activer chauffage', 'action'],
    ['action_clim_on', 'Activer climatisation', 'action'],
    ['action_ventilation_speed', 'Vitesse ventilation', 'action']
  ];

  function row(def) {
    return `<div class="form-group">
      <label class="col-sm-3 control-label">${def[1]} (${def[2]})</label>
      <div class="col-sm-6"><input class="eqLogicAttr form-control" data-l1key="configuration" data-l2key="${def[0]}"/></div>
      <div class="col-sm-2"><a class="btn btn-default bt_selectCmd" data-target="${def[0]}" data-type="${def[2]}"><i class="fas fa-list-alt"></i></a></div>
    </div>`;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('optimizerMappings');
    if (container) {
      container.innerHTML = mappings.map(row).join('');
      container.querySelectorAll('.bt_selectCmd').forEach(function (el) {
        el.addEventListener('click', function () {
          jeedom.cmd.getSelectModal({cmd: {type: el.dataset.type}}, function (result) {
            document.querySelector(`.eqLogicAttr[data-l1key="configuration"][data-l2key="${el.dataset.target}"]`).value = result.cmd.id;
          });
        });
      });
    }
  });
})();
