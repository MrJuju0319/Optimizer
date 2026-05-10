<?php
if (!isConnect('admin')) {
    throw new Exception('{{401 - Accès non autorisé}}');
}
$eqLogics = eqLogic::byType('optimizer');
$defs = optimizer::internalCommandDefinitions();
?>
<div class="row row-overflow">
  <div class="col-lg-3">
    <legend>{{Zones}}</legend>
    <div class="eqLogicThumbnailContainer">
      <div class="cursor eqLogicAction logoPrimary" data-action="add"><i class="fas fa-plus-circle"></i><br/>{{Ajouter}}</div>
      <?php foreach ($eqLogics as $eqLogic) { ?>
      <div class="cursor eqLogicDisplayCard" data-eqLogic_id="<?php echo $eqLogic->getId(); ?>"><span><?php echo $eqLogic->getHumanName(true, true); ?></span></div>
      <?php } ?>
    </div>
  </div>

  <div class="col-lg-9 eqLogic" style="display:none;">
    <input class="eqLogicAttr" data-l1key="id" style="display:none;"/>
    <div class="form-horizontal">
      <fieldset>
        <legend>{{Configuration zone}}</legend>
        <div class="form-group"><label class="col-sm-3 control-label">{{Nom}}</label><div class="col-sm-6"><input class="eqLogicAttr form-control" data-l1key="name"/></div></div>
        <div class="form-group"><label class="col-sm-3 control-label">{{Mode}}</label><div class="col-sm-4"><select class="eqLogicAttr form-control" data-l1key="configuration" data-l2key="mode"><option value="auto">Auto</option><option value="manuel">Manuel</option><option value="absence">Absence</option><option value="nuit">Nuit</option><option value="confort">Confort</option><option value="eco">Eco</option></select></div></div>
        <div class="form-group"><label class="col-sm-3 control-label">{{Consigne °C}}</label><div class="col-sm-3"><input type="number" step="0.1" class="eqLogicAttr form-control" data-l1key="configuration" data-l2key="target_temp"/></div></div>
      </fieldset>

      <fieldset>
        <legend>{{Associations commandes Jeedom}}</legend>
        <div id="optimizerMappings"></div>
      </fieldset>

      <fieldset>
        <legend>{{Commandes internes générées}}</legend>
        <table class="table table-condensed table-bordered"><thead><tr><th>{{ID logique}}</th><th>{{Nom}}</th><th>{{Type}}</th></tr></thead><tbody>
          <?php foreach ($defs as $id => $def) { echo '<tr><td>' . $id . '</td><td>' . $def['name'] . '</td><td>' . $def['type'] . '/' . $def['subType'] . '</td></tr>'; } ?>
        </tbody></table>
      </fieldset>
    </div>
  </div>
</div>
