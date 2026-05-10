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

  function buildZoneRow(zone) {
    var z = zone || {};
    return '<tr>' +
      '<td><input class="form-control zoneField" data-field="name" value="' + (z.name || 'Nouvelle zone') + '"></td>' +
      '<td><div class="input-group"><input class="form-control cmdSelector zoneField" data-field="temp_info" data-subtype="info" value="' + (z.temp_info || '') + '"><span class="input-group-btn"><a class="btn btn-default bt_selectCmd"><i class="fas fa-list"></i></a></span></div></td>' +
      '<td><div class="input-group"><input class="form-control cmdSelector zoneField" data-field="heat_action" data-subtype="action" value="' + (z.heat_action || '') + '"><span class="input-group-btn"><a class="btn btn-default bt_selectCmd"><i class="fas fa-list"></i></a></span></div></td>' +
      '<td><div class="input-group"><input class="form-control cmdSelector zoneField" data-field="cool_action" data-subtype="action" value="' + (z.cool_action || '') + '"><span class="input-group-btn"><a class="btn btn-default bt_selectCmd"><i class="fas fa-list"></i></a></span></div></td>' +
      '<td><div class="input-group"><input class="form-control cmdSelector zoneField" data-field="shutter_action" data-subtype="action" value="' + (z.shutter_action || '') + '"><span class="input-group-btn"><a class="btn btn-default bt_selectCmd"><i class="fas fa-list"></i></a></span></div></td>' +
      '<td><div class="input-group"><input class="form-control cmdSelector zoneField" data-field="light_action" data-subtype="action" value="' + (z.light_action || '') + '"><span class="input-group-btn"><a class="btn btn-default bt_selectCmd"><i class="fas fa-list"></i></a></span></div></td>' +
      '<td><div class="input-group"><input class="form-control cmdSelector zoneField" data-field="vent_action" data-subtype="action" value="' + (z.vent_action || '') + '"><span class="input-group-btn"><a class="btn btn-default bt_selectCmd"><i class="fas fa-list"></i></a></span></div></td>' +
      '<td><a class="btn btn-danger btn-xs bt_removeZone"><i class="fas fa-trash"></i> Supprimer</a></td>' +
      '</tr>';
  }

  function getZonesData() {
    var zones = [];
    $('#tableZones tbody tr').each(function () {
      var zone = {};
      $(this).find('.zoneField').each(function () {
        zone[$(this).data('field')] = $(this).val();
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
    zones.forEach(function (z) {
      $('#tableZones tbody').append(buildZoneRow(z));
    });
    if (zones.length === 0) {
      $('#tableZones tbody').append(buildZoneRow());
    }
  }

  function saveAllConfiguration() {
    var payload = {};
    $('.configKey').each(function () {
      payload[$(this).attr('data-l1key')] = $(this).val();
    });
    payload.zones_config = JSON.stringify(getZonesData());

    jeedom.config.save({
      plugin: 'optimizer',
      configuration: payload,
      error: function (error) {
        $('#div_alert').showAlert({message: error.message, level: 'danger'});
      },
      success: function () {
        $('#div_alert').showAlert({message: 'Configuration globale du plugin sauvegardée', level: 'success'});
        $('#opt_mode').text(payload.global_mode);
        $('#opt_comfort').text(payload.target_comfort + '°C');
      }
    });
  }

  $('body').off('click', '.bt_selectCmd').on('click', '.bt_selectCmd', function () {
    var $input = $(this).closest('.input-group').find('.cmdSelector');
    selectCmd($input);
  });

  $('#bt_addZone').off('click').on('click', function () {
    $('#tableZones tbody').append(buildZoneRow());
  });

  $('#bt_backPage').off('click').on('click', function () {
    window.history.back();
  });

  $('#bt_saveAll, #bt_saveGlobal').off('click').on('click', function () {
    saveAllConfiguration();
  });

  $('body').off('click', '.bt_removeZone').on('click', '.bt_removeZone', function () {
    $(this).closest('tr').remove();
  });

  jeedom.config.load({
    plugin: 'optimizer',
    configuration: ['global_mode', 'target_comfort', 'zones_config'],
    success: function (data) {
      if (data.global_mode) $('[data-l1key="global_mode"]').val(data.global_mode);
      if (data.target_comfort) $('[data-l1key="target_comfort"]').val(data.target_comfort);
      if (data.zones_config) {
        try {
          loadZonesData(JSON.parse(data.zones_config));
        } catch (e) {
          $('#tableZones tbody').append(buildZoneRow());
        }
      }
    }
  });
})();
