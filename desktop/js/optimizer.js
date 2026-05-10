"use strict";

(function () {
  function selectCmd($input) {
    if (typeof jeedom === 'undefined' || typeof jeedom.cmd === 'undefined') {
      return;
    }
    jeedom.cmd.getSelectModal({cmd: {type: $input.data('subtype') || 'info'}}, function (result) {
      if (result && result.human) {
        $input.val(result.human).trigger('change');
      }
    });
  }

  function paramLine(label, useKey, cmdKey, z) {
    var checked = z[useKey] ? 'checked' : '';
    var val = z[cmdKey] || '';
    return '<div class="form-inline" style="margin-bottom:4px;">' +
      '<label><input type="checkbox" class="zoneField" data-field="' + useKey + '" ' + checked + '> ' + label + '</label>' +
      '<input class="form-control cmdSelector zoneField" data-field="' + cmdKey + '" data-subtype="info" style="width:55%;margin-left:8px;" value="' + val + '">' +
      '</div>';
  }

  function buildZoneRow(zone) {
    var z = zone || {};
    var params = '';
    params += paramLine('Température intérieure (°C)', 'use_temp_indoor', 'temp_indoor_cmd', z);
    params += paramLine('Hygrométrie intérieure (%)', 'use_hygro_indoor', 'hygro_indoor_cmd', z);
    params += paramLine('Luminosité intérieure (lux)', 'use_lux_indoor', 'lux_indoor_cmd', z);
    params += paramLine('Présence / occupation', 'use_presence', 'presence_cmd', z);
    params += paramLine('Mouvement', 'use_motion', 'motion_cmd', z);
    params += paramLine('État fenêtre (ouverte/fermée)', 'use_window', 'window_cmd', z);
    params += paramLine('État porte (ouverte/fermée)', 'use_door', 'door_cmd', z);
    params += paramLine('Température de consigne (°C)', 'use_setpoint', 'setpoint_cmd', z);
    params += paramLine('État chauffage (Off, Chaud, Froid)', 'use_heating_state', 'heating_state_cmd', z);
    params += paramLine('État volet (position %)', 'use_shutter_state', 'shutter_state_cmd', z);
    params += paramLine('État lumière (On/Off, intensité %)', 'use_light_state', 'light_state_cmd', z);
    params += paramLine('Qualité air CO2', 'use_co2', 'co2_cmd', z);

    return '<tr>' +
      '<td><input class="form-control zoneField" data-field="name" value="' + (z.name || 'Nouvelle zone') + '"></td>' +
      '<td><div class="zoneParams">' + params + '</div></td>' +
      '<td><a class="btn btn-danger btn-xs bt_removeZone"><i class="fas fa-trash"></i> Supprimer</a></td>' +
      '</tr>';
  }

  function getZonesData() {
    var zones = [];
    $('#tableZones tbody tr').each(function () {
      var zone = {};
      $(this).find('.zoneField').each(function () {
        var key = $(this).data('field');
        zone[key] = $(this).attr('type') === 'checkbox' ? $(this).is(':checked') : $(this).val();
      });
      if ((zone.name || '').trim() !== '') {
        zones.push(zone);
      }
    });
    return zones;
  }

  function loadZonesData(zones) {
    if (!Array.isArray(zones)) return;
    $('#tableZones tbody').empty();
    zones.forEach(function (z) { $('#tableZones tbody').append(buildZoneRow(z)); });
    if (zones.length === 0) $('#tableZones tbody').append(buildZoneRow());
  }

  function saveAllConfiguration() {
    var payload = {};
    $('.configKey').each(function () { payload[$(this).attr('data-l1key')] = $(this).val(); });
    payload.zones_config = JSON.stringify(getZonesData());

    jeedom.config.save({
      plugin: 'optimizer',
      configuration: payload,
      error: function (error) { $('#div_alert').showAlert({message: error.message, level: 'danger'}); },
      success: function () {
        $('#div_alert').showAlert({message: 'Configuration globale du plugin sauvegardée', level: 'success'});
        $('#opt_mode').text(payload.global_mode);
        $('#opt_comfort').text(payload.target_comfort + '°C');
      }
    });
  }

  $('body').off('click', '.bt_selectCmd').on('click', '.bt_selectCmd', function () { selectCmd($(this).closest('.form-inline, .input-group').find('.cmdSelector').first()); });
  $('#bt_addZone').off('click').on('click', function () { $('#tableZones tbody').append(buildZoneRow()); });
  $('#bt_backPage').off('click').on('click', function () { window.history.back(); });
  $('#bt_saveAll, #bt_saveGlobal').off('click').on('click', function () { saveAllConfiguration(); });
  $('body').off('click', '.bt_removeZone').on('click', '.bt_removeZone', function () { $(this).closest('tr').remove(); });

  jeedom.config.load({
    plugin: 'optimizer',
    configuration: ['global_mode', 'target_comfort', 'zones_config'],
    success: function (data) {
      if (data.global_mode) $('[data-l1key="global_mode"]').val(data.global_mode);
      if (data.target_comfort) $('[data-l1key="target_comfort"]').val(data.target_comfort);
      if (data.zones_config) {
        try { loadZonesData(JSON.parse(data.zones_config)); } catch (e) { $('#tableZones tbody').append(buildZoneRow()); }
      } else {
        $('#tableZones tbody').empty().append(buildZoneRow({use_temp_indoor:true,use_setpoint:true}));
      }
    }
  });
})();
