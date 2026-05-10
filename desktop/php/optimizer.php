<?php

if (!isConnect('admin')) {
    throw new Exception(__('401 - Accès non autorisé', __FILE__));
}

sendVarToJS('eqType', 'optimizer');
$eqLogics = eqLogic::byType('optimizer');
?>

<div class="row row-overflow">
  <div class="col-lg-12">
    <legend><i class="fas fa-sliders-h"></i> {{Optimizer}}</legend>
    <div class="alert alert-info">
      {{Base du plugin Optimizer initialisée. Les fonctionnalités de pilotage intelligent seront ajoutées progressivement.}}
    </div>
  </div>
</div>
