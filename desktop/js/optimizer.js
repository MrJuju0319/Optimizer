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

  function buildZoneRow() {
    return '<tr>' +
      '<td><input class="form-control" value="Nouvelle zone"></td>' +
      '<td><div class="input-group"><input class="form-control cmdSelector" data-subtype="info"><span class="input-group-btn"><a class="btn btn-default bt_selectCmd"><i class="fas fa-list"></i></a></span></div></td>' +
      '<td><div class="input-group"><input class="form-control cmdSelector" data-subtype="action"><span class="input-group-btn"><a class="btn btn-default bt_selectCmd"><i class="fas fa-list"></i></a></span></div></td>' +
      '<td><div class="input-group"><input class="form-control cmdSelector" data-subtype="action"><span class="input-group-btn"><a class="btn btn-default bt_selectCmd"><i class="fas fa-list"></i></a></span></div></td>' +
      '<td><div class="input-group"><input class="form-control cmdSelector" data-subtype="action"><span class="input-group-btn"><a class="btn btn-default bt_selectCmd"><i class="fas fa-list"></i></a></span></div></td>' +
      '<td><div class="input-group"><input class="form-control cmdSelector" data-subtype="action"><span class="input-group-btn"><a class="btn btn-default bt_selectCmd"><i class="fas fa-list"></i></a></span></div></td>' +
      '<td><div class="input-group"><input class="form-control cmdSelector" data-subtype="action"><span class="input-group-btn"><a class="btn btn-default bt_selectCmd"><i class="fas fa-list"></i></a></span></div></td>' +
      '<td><a class="btn btn-danger btn-xs bt_removeZone"><i class="fas fa-trash"></i> Supprimer</a></td>' +
      '</tr>';
  }

  $('body').off('click', '.bt_selectCmd').on('click', '.bt_selectCmd', function () {
    var $input = $(this).closest('.input-group').find('.cmdSelector');
    selectCmd($input);
  });

  $('#bt_addZone').off('click').on('click', function () {
    $('#tableZones tbody').append(buildZoneRow());
  });

  $('body').off('click', '.bt_removeZone').on('click', '.bt_removeZone', function () {
    $(this).closest('tr').remove();
  });

  $('#bt_saveGlobal').off('click').on('click', function () {
    var payload = {};
    $('.configKey').each(function () {
      payload[$(this).attr('data-l1key')] = $(this).val();
    });

    jeedom.config.save({
      plugin: 'optimizer',
      configuration: payload,
      error: function (error) {
        $('#div_alert').showAlert({message: error.message, level: 'danger'});
      },
      success: function () {
        $('#div_alert').showAlert({message: 'Configuration sauvegardée', level: 'success'});
        $('#opt_mode').text(payload.global_mode);
        $('#opt_comfort').text(payload.target_comfort + '°C');
      }
    });
  });

  jeedom.config.load({
    plugin: 'optimizer',
    configuration: ['global_mode', 'target_comfort'],
    success: function (data) {
      if (data.global_mode) $('[data-l1key="global_mode"]').val(data.global_mode);
      if (data.target_comfort) $('[data-l1key="target_comfort"]').val(data.target_comfort);
    }
  });
})();
