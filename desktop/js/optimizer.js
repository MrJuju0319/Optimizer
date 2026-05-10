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

  function paramLine(label, useKey, cmdKey, unitText, z) {
    var checked = z[useKey] ? 'checked' : '';
    var val = z[cmdKey] || '';
    return {
      tracked: '<div style="margin-bottom:6px;"><label><input type="checkbox" class="zoneField" data-field="' + useKey + '" ' + checked + '> ' + label + '</label></div>',
      info: '<div class="input-group" style="margin-bottom:4px;"><input class="form-control cmdSelector zoneField" data-field="' + cmdKey + '" data-subtype="info" value="' + val + '"><span class="input-group-btn"><a class="btn btn-default bt_selectCmd" title="Choisir une commande"><i class="fas fa-list"></i></a><a class="btn btn-info bt_readValue" title="Récupérer la valeur"><i class="fas fa-download"></i></a></span></div>',
      value: '<div style="margin-bottom:6px;"><span class="label label-default zoneLiveValue">-</span></div>',
      unit: '<div style="margin-bottom:6px;"><span class="label label-info">' + unitText + '</span></div>'
    };
  }

  function buildZoneRow(zone) {
    var z = zone || {};
    var parts = {tracked:'', info:'', value:'', unit:''};
    [
      paramLine('Température intérieure', 'use_temp_indoor', 'temp_indoor_cmd', '°C', z),
      paramLine('Hygrométrie intérieure', 'use_hygro_indoor', 'hygro_indoor_cmd', '%', z),
      paramLine('Luminosité intérieure', 'use_lux_indoor', 'lux_indoor_cmd', 'lux', z),
      paramLine('Présence / occupation', 'use_presence', 'presence_cmd', 'occupé=1 / 0', z),
      paramLine('Mouvement', 'use_motion', 'motion_cmd', 'mouvement=1 / 0', z),
      paramLine('État fenêtre', 'use_window', 'window_cmd', 'ouverte=1 / fermée=0', z),
      paramLine('État porte', 'use_door', 'door_cmd', 'ouverte=1 / fermée=0', z),
      paramLine('Température de consigne', 'use_setpoint', 'setpoint_cmd', '°C', z),
      paramLine('État chauffage', 'use_heating_state', 'heating_state_cmd', 'Off / Chaud / Froid', z),
      paramLine('État volet', 'use_shutter_state', 'shutter_state_cmd', 'position %', z),
      paramLine('État lumière', 'use_light_state', 'light_state_cmd', 'intensité %', z),
      paramLine('Qualité air CO2', 'use_co2', 'co2_cmd', 'ppm', z)
    ].forEach(function (p) { parts.tracked += p.tracked; parts.info += p.info; parts.value += p.value; parts.unit += p.unit; });

    return '<tr>' +
      '<td style="vertical-align:top;"><input class="form-control zoneField" data-field="name" value="' + (z.name || 'Nouvelle zone') + '"></td>' +
      '<td style="vertical-align:top;"><div class="zoneParams">' + parts.tracked + '</div></td>' +
      '<td style="vertical-align:top;"><div class="zoneParams">' + parts.info + '</div></td>' +
      '<td style="vertical-align:top;"><div class="zoneParams">' + parts.value + '</div></td>' +
      '<td style="vertical-align:top;"><div class="zoneParams">' + parts.unit + '</div></td>' +
      '<td style="vertical-align:top;"><a class="btn btn-danger btn-xs bt_removeZone"><i class="fas fa-trash"></i> Supprimer</a></td>' +
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



  function refreshOneValue($input) {
    var human = ($input.val() || "").trim();
    var $row = $input.closest("tr");
    var idx = $row.find(".cmdSelector").index($input);
    var $badge = $row.find(".zoneLiveValue").eq(idx);
    if (!human) { $badge.text("-"); return; }
    if (!jeedom.cmd || !jeedom.cmd.byHumanName) { $badge.text("N/A"); return; }
    jeedom.cmd.byHumanName({
      humanName: human,
      error: function () { $badge.text("Erreur"); },
      success: function (cmd) {
        if (!cmd || !cmd.id) { $badge.text("?"); return; }
        jeedom.cmd.execute({
          id: cmd.id, cache: 0,
          error: function () { $badge.text("Err"); },
          success: function (value) { $badge.text(value === "" || value === null ? "Vide" : value); }
        });
      }
    });
  }


  function getExtraUserParameters() {
    var extra = {};
    $('.optimizerUserParam').each(function () {
      var key = $(this).attr('data-key');
      if (!key) return;
      extra[key] = $(this).attr('type') === 'checkbox' ? $(this).is(':checked') : $(this).val();
    });
    return extra;
  }

  function saveAllConfiguration() {
    var payload = {};
    $('.configKey').each(function () { payload[$(this).attr('data-l1key')] = $(this).val(); });
    payload.zones_config = JSON.stringify(getZonesData());
    payload.user_parameters = JSON.stringify(getExtraUserParameters());

    $.ajax({
      type: 'POST',
      url: 'plugins/optimizer/core/ajax/optimizer.ajax.php',
      dataType: 'json',
      data: {action: 'saveConfig', payload: JSON.stringify(payload)},
      error: function (request) { $('#div_alert').showAlert({message: request.responseText || 'Erreur sauvegarde', level: 'danger'}); },
      success: function (res) {
        if (res.state !== 'ok') {
          $('#div_alert').showAlert({message: (res.result || 'Erreur sauvegarde'), level: 'danger'});
          return;
        }
        var zoneCount = getZonesData().length;
        $('#div_alert').showAlert({message: 'Configuration sauvegardée (' + zoneCount + ' zone(s))', level: 'success'});
        $('#opt_mode').text(payload.global_mode);
        $('#opt_comfort').text(payload.target_comfort + '°C');
      }
    });
  }

  $('body').off('click', '.bt_selectCmd').on('click', '.bt_selectCmd', function () {
    selectCmd($(this).closest('.input-group').find('.cmdSelector').first());
  });
  $('body').off('click', '.bt_readValue').on('click', '.bt_readValue', function () {
    refreshOneValue($(this).closest('.input-group').find('.cmdSelector').first());
  });
  $('#bt_addZone').off('click').on('click', function () { $('#tableZones tbody').append(buildZoneRow()); });
  $('#bt_backPage').off('click').on('click', function () { window.history.back(); });

  $('body').off('click', '.bt_removeZone').on('click', '.bt_removeZone', function () { $(this).closest('tr').remove(); });

  $.ajax({
    type: 'POST',
    url: 'plugins/optimizer/core/ajax/optimizer.ajax.php',
    dataType: 'json',
    data: {action: 'loadConfig', keys: JSON.stringify(['global_mode', 'target_comfort', 'zones_config', 'user_parameters'])},
    success: function (res) {
      if (!res || res.state !== 'ok') {
        $('#tableZones tbody').empty().append(buildZoneRow({use_temp_indoor:true,use_setpoint:true}));
        return;
      }
      var data = res.result || {};
      if (data.global_mode) $('[data-l1key="global_mode"]').val(data.global_mode);
      if (data.target_comfort) $('[data-l1key="target_comfort"]').val(data.target_comfort);
      if (data.zones_config) {
        try { loadZonesData(JSON.parse(data.zones_config)); } catch (e) { $('#tableZones tbody').append(buildZoneRow()); }
      } else {
        $('#tableZones tbody').empty().append(buildZoneRow({use_temp_indoor:true,use_setpoint:true}));
      }
    },
    error: function () {
      $('#tableZones tbody').empty().append(buildZoneRow({use_temp_indoor:true,use_setpoint:true}));
    }
  });
})();
