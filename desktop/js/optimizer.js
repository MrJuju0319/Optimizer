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
    var defs = [
      {label:'Température intérieure', useKey:'use_temp_indoor', cmdKey:'temp_indoor_cmd', unit:'°C'},
      {label:'Hygrométrie intérieure', useKey:'use_hygro_indoor', cmdKey:'hygro_indoor_cmd', unit:'%'},
      {label:'Luminosité intérieure', useKey:'use_lux_indoor', cmdKey:'lux_indoor_cmd', unit:'lux'},
      {label:'Présence / occupation', useKey:'use_presence', cmdKey:'presence_cmd', unit:'occupé=1'},
      {label:'Mouvement', useKey:'use_motion', cmdKey:'motion_cmd', unit:'mouvement=1'},
      {label:'État fenêtre', useKey:'use_window', cmdKey:'window_cmd', unit:'ouverte=1'},
      {label:'État porte', useKey:'use_door', cmdKey:'door_cmd', unit:'ouverte=1'},
      {label:'État chauffage', useKey:'use_heating_state', cmdKey:'heating_state_cmd', unit:'Off / Chaud / Froid'},
      {label:'État volet', useKey:'use_shutter_state', cmdKey:'shutter_state_cmd', unit:'position %'},
      {label:'État lumière', useKey:'use_light_state', cmdKey:'light_state_cmd', unit:'intensité %'},
      {label:'Qualité air CO2', useKey:'use_co2', cmdKey:'co2_cmd', unit:'ppm'}
    ];
    var defByUseKey = {};
    defs.forEach(function (d) { defByUseKey[d.useKey] = d; });
    var params = defs.map(function (d) { return paramLine(d.label, d.useKey, d.cmdKey, d.unit, z); });
    Object.keys(z).forEach(function (key) {
      var m = key.match(/^(use_[^_]+(?:_[^_]+)*)__extra_.+$/);
      if (!m) return;
      var baseUseKey = m[1];
      var suffix = key.substring(baseUseKey.length + 2);
      var d = defByUseKey[baseUseKey];
      if (!d) return;
      var extraUseKey = baseUseKey + '__' + suffix;
      var extraCmdKey = d.cmdKey + '__' + suffix;
      params.push(paramLine(d.label, extraUseKey, extraCmdKey, d.unit, z));
    });
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
    var baseUseKey = $meta.data('usekey');
    var baseCmdKey = $meta.data('cmdkey');
    var suffix = 'extra_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    var extraUseKey = baseUseKey + '__' + suffix;
    var extraCmdKey = baseCmdKey + '__' + suffix;
    var p = paramLine($meta.data('label'), extraUseKey, extraCmdKey, $meta.data('unit'), {});
    var extraInfo = p.info.replace('</span></div>', '<a class="btn btn-danger bt_removeParamLine" title="Supprimer cette ligne"><i class="fas fa-minus"></i></a></span></div>');
    var html = '<tr data-zone-id="' + zoneId + '" class="zone-extra-line">' +
      '<td style="vertical-align:top;">' + p.tracked + '</td>' +
      '<td style="vertical-align:top;">' + extraInfo + '</td>' +
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

  function buildPilotageRow(zoneName, pilotage, stateCounts) {
    var p = pilotage || {};
    var counts = stateCounts || {heating: 1, shutter: 1, light: 1};
    function cmdBlock(title, field, value) {
      return '<div style="font-size:11px;font-weight:bold;">' + title + '</div><div class="input-group" style="margin-bottom:4px;"><input class="form-control cmdSelector pilotField" data-field="' + field + '" data-subtype="action" value="' + (value || '') + '"><span class="input-group-btn"><a class="btn btn-default bt_selectCmd" title="Choisir une commande"><i class="fas fa-list"></i></a></span></div>';
    }
    var heatingHtml = '';
    for (var h = 1; h <= Math.max(1, counts.heating); h++) {
      var hs = counts.heating > 1 ? ' #' + h : '';
      heatingHtml += cmdBlock('Mode chaud' + hs, 'heating_mode_hot_cmd_' + h, p['heating_mode_hot_cmd_' + h]);
      heatingHtml += cmdBlock('Mode froid' + hs, 'heating_mode_cold_cmd_' + h, p['heating_mode_cold_cmd_' + h]);
      heatingHtml += cmdBlock('Chauffage ON' + hs, 'heating_on_cmd_' + h, p['heating_on_cmd_' + h]);
      heatingHtml += cmdBlock('Chauffage OFF' + hs, 'heating_off_cmd_' + h, p['heating_off_cmd_' + h]);
      heatingHtml += cmdBlock('Consigne chaud' + hs, 'setpoint_hot_cmd_' + h, p['setpoint_hot_cmd_' + h]);
      heatingHtml += cmdBlock('Consigne froid' + hs, 'setpoint_cold_cmd_' + h, p['setpoint_cold_cmd_' + h]);
    }
    var shutterHtml = '';
    for (var s = 1; s <= Math.max(1, counts.shutter); s++) {
      var ss = counts.shutter > 1 ? ' #' + s : '';
      shutterHtml += cmdBlock('Position % (prioritaire)' + ss, 'shutter_position_cmd_' + s, p['shutter_position_cmd_' + s]);
      shutterHtml += cmdBlock('Ouverture' + ss, 'shutter_open_cmd_' + s, p['shutter_open_cmd_' + s]);
      shutterHtml += cmdBlock('Fermeture' + ss, 'shutter_close_cmd_' + s, p['shutter_close_cmd_' + s]);
    }
    var lightHtml = '';
    for (var l = 1; l <= Math.max(1, counts.light); l++) {
      var ls = counts.light > 1 ? ' #' + l : '';
      lightHtml += cmdBlock('Lumière ON' + ls, 'light_on_cmd_' + l, p['light_on_cmd_' + l]);
      lightHtml += cmdBlock('Lumière OFF' + ls, 'light_off_cmd_' + l, p['light_off_cmd_' + l]);
      lightHtml += cmdBlock('Luminosité' + ls, 'light_level_cmd_' + l, p['light_level_cmd_' + l]);
    }
    return '<tr>' +
      '<td><input class="form-control pilotField" data-field="zone_name" value="' + (zoneName || '') + '" readonly></td>' +
      '<td>' + heatingHtml + '</td>' +
      '<td>' + shutterHtml + '</td>' +
      '<td>' + lightHtml + '</td>' +
      '</tr>';
  }

  function getPilotageData() {
    var rows = [];
    $('#tableGlobalPilotage tbody tr').each(function () {
      var row = {};
      $(this).find('.pilotField').each(function () {
        row[$(this).data('field')] = $(this).val();
      });
      if ((row.zone_name || '').trim() !== '') rows.push(row);
    });
    return rows;
  }

  function syncGlobalPilotageRows(pilotageConfig) {
    var byZone = {};
    (pilotageConfig || []).forEach(function (p) { byZone[p.zone_name] = p; });
    var zoneDescriptors = [];
    $('#tableZones tbody tr.zone-start').each(function () {
      var $zoneRows = $('#tableZones tbody tr[data-zone-id="' + $(this).attr('data-zone-id') + '"]');
      var counts = {heating: 0, shutter: 0, light: 0};
      $zoneRows.find('.zoneParamMeta').each(function () {
        var label = ($(this).data('label') || '').toString();
        if (label.indexOf('État chauffage') === 0) counts.heating++;
        if (label.indexOf('État volet') === 0) counts.shutter++;
        if (label.indexOf('État lumière') === 0) counts.light++;
      });
      zoneDescriptors.push({
        name: (($(this).find('input[data-field=\"name\"]').val() || '').trim() || 'Nouvelle zone'),
        counts: counts
      });
    });
    $('#tableGlobalPilotage tbody').empty();
    zoneDescriptors.forEach(function (zone) {
      $('#tableGlobalPilotage tbody').append(buildPilotageRow(zone.name, byZone[zone.name], zone.counts));
    });
  }

  function saveAllConfiguration() {
    var payload = {};
    $('.configKey').each(function () { payload[$(this).attr('data-l1key')] = $(this).val(); });
    payload.zones_config = JSON.stringify(getZonesData());
    payload.user_parameters = JSON.stringify(getExtraUserParameters());
    payload.pilotage_config = JSON.stringify(getPilotageData());
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
        if (typeof payload.global_mode !== 'undefined') $('#opt_mode').text(payload.global_mode);
        if (typeof payload.target_comfort !== 'undefined') $('#opt_comfort').text(payload.target_comfort + '°C');
      }
    });
  }

  function saveZonesConfiguration() {
    var payload = {
      zones_config: JSON.stringify(getZonesData()),
      user_parameters: JSON.stringify(getExtraUserParameters()),
      pilotage_config: JSON.stringify(getPilotageData())
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
  $('body').off('change', '#tableZones .cmdSelector.zoneField').on('change', '#tableZones .cmdSelector.zoneField', function () {
    refreshOneValue($(this));
  });
  $('body').off('click', '.bt_addParamLine').on('click', '.bt_addParamLine', function () {
    addSimilarParamLine($(this).closest('tr'));
  });
  $('body').off('click', '.bt_removeParamLine').on('click', '.bt_removeParamLine', function () {
    var $row = $(this).closest('tr');
    var zoneId = $row.attr('data-zone-id');
    $row.remove();
    var $zoneStart = $('#tableZones tbody tr[data-zone-id="' + zoneId + '"].zone-start');
    var $rowspans = $zoneStart.find('td[rowspan]');
    $rowspans.each(function () {
      var current = parseInt($(this).attr('rowspan') || '1', 10);
      if (current > 1) $(this).attr('rowspan', current - 1);
    });
  });
  $('#bt_addZone').off('click').on('click', function () {
    $('#tableZones tbody').append(buildZoneRow());
    syncGlobalPilotageRows(getPilotageData());
  });
  $('#bt_saveZoneConfig').off('click').on('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    saveZonesConfiguration();
  });
  $('#bt_saveActuatorConfig').off('click').on('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    saveZonesConfiguration();
  });
  $('#bt_backPage').off('click').on('click', function () { window.history.back(); });

  $('body').off('click', '.bt_removeZone').on('click', '.bt_removeZone', function () {
    var zoneId = $(this).closest('tr').attr('data-zone-id');
    $('#tableZones tbody tr[data-zone-id="' + zoneId + '"]').remove();
    syncGlobalPilotageRows(getPilotageData());
  });

  $('body').off('change', '#tableZones input[data-field=\"name\"]').on('change', '#tableZones input[data-field=\"name\"]', function () {
    syncGlobalPilotageRows(getPilotageData());
  });

  $.ajax({
    type: 'POST',
    url: 'plugins/optimizer/core/ajax/optimizer.ajax.php',
    dataType: 'json',
    data: {action: 'loadConfig', keys: JSON.stringify(['global_mode', 'target_comfort', 'zones_config', 'user_parameters', 'pilotage_config'])},
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
      var pilotageConfig = [];
      if (data.pilotage_config) {
        try { pilotageConfig = JSON.parse(data.pilotage_config); } catch (e4) { pilotageConfig = []; }
      }
      syncGlobalPilotageRows(pilotageConfig);
      refreshAllZoneValues();
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
