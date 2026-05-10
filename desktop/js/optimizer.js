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
      tracked: '<div class="zoneParamMeta" data-label="' + label + '" data-usekey="' + useKey + '" data-cmdkey="' + cmdKey + '" data-unit="' + unitText + '" style="margin-bottom:6px;"><label><input type="checkbox" class="zoneField" data-field="' + useKey + '" ' + checked + '> ' + label + '</label></div>',
      info: '<div class="input-group" style="margin-bottom:4px;"><input class="form-control cmdSelector zoneField" data-field="' + cmdKey + '" data-subtype="info" value="' + val + '"><span class="input-group-btn"><a class="btn btn-default bt_selectCmd" title="Choisir une commande"><i class="fas fa-list"></i></a><a class="btn btn-info bt_readValue" title="Récupérer la valeur"><i class="fas fa-download"></i></a><a class="btn btn-success bt_addParamLine" title="Ajouter une ligne similaire"><i class="fas fa-plus"></i></a></span></div>',
      value: '<div style="margin-bottom:6px;"><span class="label label-default zoneLiveValue">-</span></div>',
      unit: '<div style="margin-bottom:6px;"><span class="label label-info">' + unitText + '</span></div>'
    };
  }

  function buildZoneRow(zone) {
    var z = zone || {};
    var zoneId = 'z_' + (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    var params = [
      paramLine('Température intérieure', 'use_temp_indoor', 'temp_indoor_cmd', '°C', z),
      paramLine('Hygrométrie intérieure', 'use_hygro_indoor', 'hygro_indoor_cmd', '%', z),
      paramLine('Luminosité intérieure', 'use_lux_indoor', 'lux_indoor_cmd', 'lux', z),
      paramLine('Présence / occupation', 'use_presence', 'presence_cmd', 'occupé=1', z),
      paramLine('Mouvement', 'use_motion', 'motion_cmd', 'mouvement=1', z),
      paramLine('État fenêtre', 'use_window', 'window_cmd', 'ouverte=1', z),
      paramLine('État porte', 'use_door', 'door_cmd', 'ouverte=1', z),
      paramLine('État chauffage', 'use_heating_state', 'heating_state_cmd', 'Off / Chaud / Froid', z),
      paramLine('État volet', 'use_shutter_state', 'shutter_state_cmd', 'position %', z),
      paramLine('État lumière', 'use_light_state', 'light_state_cmd', 'intensité %', z),
      paramLine('Qualité air CO2', 'use_co2', 'co2_cmd', 'ppm', z)
    ];
    var html = '';
    params.forEach(function (p, i) {
      html += '<tr data-zone-id="' + zoneId + '"' + (i === 0 ? ' class="zone-start"' : '') + '>';
      if (i === 0) html += '<td rowspan="' + params.length + '" style="vertical-align:top;"><input class="form-control zoneField" data-field="name" value="' + (z.name || 'Nouvelle zone') + '"></td>';
      html += '<td style="vertical-align:top;">' + p.tracked + '</td>';
      html += '<td style="vertical-align:top;">' + p.info + '</td>';
      html += '<td style="vertical-align:top;">' + p.value + '</td>';
      html += '<td style="vertical-align:top;">' + p.unit + '</td>';
      if (i === 0) html += '<td rowspan="' + params.length + '" style="vertical-align:top;"><a class="btn btn-danger btn-xs bt_removeZone"><i class="fas fa-trash"></i> Supprimer</a></td>';
      html += '</tr>';
    });
    return html;
  }

  function getZonesData() {
    var zones = [];
    $('#tableZones tbody tr.zone-start').each(function () {
      var zoneId = $(this).attr('data-zone-id');
      var zone = {};
      $('#tableZones tbody tr[data-zone-id="' + zoneId + '"]').find('.zoneField').each(function () {
        var key = $(this).data('field');
        zone[key] = $(this).attr('type') === 'checkbox' ? $(this).is(':checked') : $(this).val();
      });
      var hasName = (zone.name || '').trim() !== '';
      var hasTextEntry = false;
      Object.keys(zone).forEach(function (k) {
        if (k === 'name') return;
        var v = zone[k];
        if (typeof v === 'string' && v.trim() !== '') hasTextEntry = true;
      });
      if (!hasName && hasTextEntry) {
        zone.name = 'Nouvelle zone';
      }
      if (hasName || hasTextEntry) {
        zones.push(zone);
      }
    });
    return zones;
  }

  function loadZonesData(zones) {
    if (!Array.isArray(zones)) return;
    $('#tableZones tbody').empty();
    zones.forEach(function (z) { $('#tableZones tbody').append(buildZoneRow(z)); });
  }



  function refreshOneValue($input) {
    var human = ($input.val() || "").trim();
    var $row = $input.closest("tr");
    var $badge = $row.find(".zoneLiveValue").first();
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

  function refreshAllZoneValues() {
    $('#tableZones tbody .cmdSelector').each(function () {
      refreshOneValue($(this));
    });
  }

  function addSimilarParamLine($row) {
    var zoneId = $row.attr('data-zone-id');
    var $meta = $row.find('.zoneParamMeta').first();
    if ($meta.length === 0) return;
    var p = paramLine($meta.data('label'), $meta.data('usekey'), $meta.data('cmdkey'), $meta.data('unit'), {});
    var html = '<tr data-zone-id="' + zoneId + '">' +
      '<td style="vertical-align:top;">' + p.tracked + '</td>' +
      '<td style="vertical-align:top;">' + p.info + '</td>' +
      '<td style="vertical-align:top;">' + p.value + '</td>' +
      '<td style="vertical-align:top;">' + p.unit + '</td>' +
      '</tr>';
    $row.after(html);
    var $zoneStart = $('#tableZones tbody tr[data-zone-id="' + zoneId + '"].zone-start');
    var $rowspans = $zoneStart.find('td[rowspan]');
    $rowspans.each(function () {
      var current = parseInt($(this).attr('rowspan') || '1', 10);
      $(this).attr('rowspan', current + 1);
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
    try {
      localStorage.setItem('optimizer.zones_config.backup', payload.zones_config);
      localStorage.setItem('optimizer.user_parameters.backup', payload.user_parameters);
    } catch (e) {}

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

  function saveZonesConfiguration() {
    var payload = {
      zones_config: JSON.stringify(getZonesData()),
      user_parameters: JSON.stringify(getExtraUserParameters())
    };
    try {
      localStorage.setItem('optimizer.zones_config.backup', payload.zones_config);
      localStorage.setItem('optimizer.user_parameters.backup', payload.user_parameters);
    } catch (e) {}

    $.ajax({
      type: 'POST',
      url: 'plugins/optimizer/core/ajax/optimizer.ajax.php',
      dataType: 'json',
      data: {action: 'saveConfig', payload: JSON.stringify(payload)},
      error: function (request) { $('#div_alert').showAlert({message: request.responseText || 'Erreur sauvegarde des zones', level: 'danger'}); },
      success: function (res) {
        if (!res || res.state !== 'ok') {
          $('#div_alert').showAlert({message: (res && res.result) || 'Erreur sauvegarde des zones', level: 'danger'});
          return;
        }
        $('#div_alert').showAlert({message: 'Zones sauvegardées (' + getZonesData().length + ' zone(s))', level: 'success'});
        refreshAllZoneValues();
      }
    });
  }

  $('body').off('click', '.bt_selectCmd').on('click', '.bt_selectCmd', function () {
    selectCmd($(this).closest('.input-group').find('.cmdSelector').first());
  });
  $('body').off('click', '.bt_readValue').on('click', '.bt_readValue', function () {
    refreshOneValue($(this).closest('.input-group').find('.cmdSelector').first());
  });
  $('body').off('click', '.bt_addParamLine').on('click', '.bt_addParamLine', function () {
    addSimilarParamLine($(this).closest('tr'));
  });
  $('#bt_addZone').off('click').on('click', function () { $('#tableZones tbody').append(buildZoneRow()); });
  $('#bt_saveZoneConfig').off('click').on('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    saveZonesConfiguration();
  });
  $('#bt_backPage').off('click').on('click', function () { window.history.back(); });

  $('body').off('click', '.bt_removeZone').on('click', '.bt_removeZone', function () {
    var zoneId = $(this).closest('tr').attr('data-zone-id');
    $('#tableZones tbody tr[data-zone-id="' + zoneId + '"]').remove();
  });

  $.ajax({
    type: 'POST',
    url: 'plugins/optimizer/core/ajax/optimizer.ajax.php',
    dataType: 'json',
    data: {action: 'loadConfig', keys: JSON.stringify(['global_mode', 'target_comfort', 'zones_config', 'user_parameters'])},
    success: function (res) {
      if (!res || res.state !== 'ok') {
        try {
          var zonesBackupOnError = localStorage.getItem('optimizer.zones_config.backup');
          if (zonesBackupOnError) {
            loadZonesData(JSON.parse(zonesBackupOnError));
          } else {
            $('#tableZones tbody').empty();
          }
        } catch (e0) {
          $('#tableZones tbody').empty();
        }
        return;
      }
      var data = res.result || {};
      if (data.global_mode) $('[data-l1key="global_mode"]').val(data.global_mode);
      if (data.target_comfort) $('[data-l1key="target_comfort"]').val(data.target_comfort);
      if (data.zones_config) {
        try {
          var serverZones = JSON.parse(data.zones_config);
          if (Array.isArray(serverZones) && serverZones.length > 0) {
            loadZonesData(serverZones);
          } else {
            var zonesBackupIfEmpty = localStorage.getItem('optimizer.zones_config.backup');
            if (zonesBackupIfEmpty) {
              loadZonesData(JSON.parse(zonesBackupIfEmpty));
            } else {
              $('#tableZones tbody').empty();
            }
          }
        } catch (e) {
          try {
            var zonesBackupIfParseError = localStorage.getItem('optimizer.zones_config.backup');
            if (zonesBackupIfParseError) {
              loadZonesData(JSON.parse(zonesBackupIfParseError));
            } else {
              $('#tableZones tbody').empty();
            }
          } catch (e1) {
            $('#tableZones tbody').empty();
          }
        }
      } else {
        try {
          var zonesBackup = localStorage.getItem('optimizer.zones_config.backup');
          if (zonesBackup) {
            loadZonesData(JSON.parse(zonesBackup));
          } else {
            $('#tableZones tbody').empty();
          }
        } catch (e2) {
          $('#tableZones tbody').empty();
        }
      }
    },
    error: function () {
      try {
        var zonesBackupOnAjaxError = localStorage.getItem('optimizer.zones_config.backup');
        if (zonesBackupOnAjaxError) {
          loadZonesData(JSON.parse(zonesBackupOnAjaxError));
        } else {
          $('#tableZones tbody').empty();
        }
      } catch (e3) {
        $('#tableZones tbody').empty();
      }
    }
  });
})();
