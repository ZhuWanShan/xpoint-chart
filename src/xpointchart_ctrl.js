import {MetricsPanelCtrl} from "app/plugins/sdk";
import $ from 'jquery';
import _ from 'lodash'
import moment from 'moment'

export class XPointChartCtrl extends MetricsPanelCtrl {

  constructor($scope, $injector, $rootScope) {
    super($scope, $injector);
    this.$rootScope = $rootScope;

    if (!this.panel.statisticName) {
      this.panel.statisticName = 'test'
    }

    this.spinTemplate = "<span id='spin_"
      + this.xpointId
      + "' class='panel-loading'><i class='fa fa-spinner fa-spin'></i></span>";

    this.events.on('refresh', this.onRefresh.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
  }

  initSizeChangeMonitor(){
    if(!this.sizeChangeMonitorInitialized){
      this.sizeH = this.rootPanel().height();
      this.sizeW = this.rootPanel().width();
      let self = this;
      this.rootPanel()
        .css("-moz-transition", "width 0.01s, height 0.01s")
        .css("-webkit-transition", "width 0.01s, height 0.01s")
        .css("-o-transition:width", "width 0.01s, height 0.01s")
        .css("transition", "width 0.01s, height 0.01s")
        .on("webkitTransitionEnd transitionend oTransitionEnd", function () {
          if(
            Math.abs(self.sizeH - self.rootPanel().height()) > 1
            || Math.abs(self.sizeW - self.rootPanel().width()) > 1
          ){
            self.contentPanel().hide();
            self.onRefresh();
          }

        });
      this.rootPanel().find('.resize-panel-handle')
        .mousedown(function () {
          self.contentPanel().hide();
        })
        .mouseup(function () {
          self.onRefresh();
        });
      this.sizeChangeMonitorInitialized = true;
    }
  }

  rootPanel(){
    let row = this.dashboard.rows.indexOf(this.row);
    let col = this.row.panels.indexOf(this.panel);
    return $($($($(".dash-row")[row]).find(".panel")[col]));
  }

  contentPanel(){
    return this.rootPanel().find('.panel-content');
  }

  createChartPanel(){
    let myParent = this.contentPanel();

    let panel = myParent.find(".graph-canvas-wrapper");
    panel.height(this.rootPanel().find(".panel-container").height() - 20);
    panel.width(this.rootPanel().find(".panel-container").innerWidth() - 20);

    return panel;
  }

  pending(){
    if(!this.isPending){
      if($('#spin_' + this.xpointId).length < 1){
        let target = this.rootPanel().find(".panel-loading");
        $(this.spinTemplate).insertBefore(target);
      }
      this.isPending = true;
    }
  }

  complete(){
    this.contentPanel().show();
    let id = '#spin_' + this.xpointId;
    $(id).remove();
    this.sizeH = this.rootPanel().height();
    this.sizeW = this.rootPanel().width();
    this.isPending = false;
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/xpoint-chart/editor.html');
    this.editorTabs[1] = this.editorTabs[this.editorTabs.length - 1];
    this.editorTabs.pop();
  }

  context(){
    let self = this;
    let ONE_HOUR = 3600 * 1000;
    let ONE_DAY =  84000 * 1000;

    let param = {};

    _.forEach(this.templateSrv.variables, function(it){
      param[it.name] = {
        value: it.current.value,
        text: it.current.text
      }
    });

    let timeRange = this.range;

    if(timeRange && timeRange.from && timeRange.to){
      timeRange.from = parseInt(timeRange.from / ONE_HOUR) * ONE_HOUR;
      timeRange.to = parseInt(timeRange.to / ONE_HOUR) * ONE_HOUR;
    }else{
      timeRange.to = parseInt(moment().toDate().getTime() / ONE_HOUR) * ONE_HOUR;
      timeRange.from = timeRange.to - ONE_DAY * 7
    }

    return {
      param: param,
      range: timeRange,
      size: {
        height: self.sizeH,
        width: self.sizeW
      }
    };
  }

  stats(){
    return this.templateSrv.replace(this.panel.statisticName, this.panel.scopedVars, 'pipe');
  }

  refreshChart() {
    let stats =  this.stats();
    let ctx = this.context();
    let el = this.createChartPanel()[0];
    let self  = this;

    if(!_.isEqual(self._stats, stats) || self.chart == undefined){
      self.pending();
      self._stats = stats;
      let statsLocation = 'chart/' + self._stats;


      if(!_.isEqual(self._stats, stats)) {
        console.log("Stats Changed, from " + self._stats + " to " + stats);
      }else{
        console.log("First Time init " + self._stats);
      }

      requirejs([statsLocation], function (chart) {
        try{
        self.chart = chart(self, el);
        self.chart.create(ctx);
        }catch (e){
          console.log(e);
          $(el).html("Faild to Load " + stats);
          self.complete();
        }
      });


    }else if(!_.isEqual(self._context, ctx)){
      self.chart.onContextChange(ctx, self._context);
      self._context = ctx;
    }else {
      self.chart.onContextChange(ctx, self._context);
      console.log("Nothing Changed")
    }
  }

  fetchData(hook, func, param, span, type, format) {
    let url = this.genUrl(func, param, span, type, format);
    $.ajax({
      url : url,
      dataType: "json",
      success: hook? hook.success : undefined,
      error: hook? hook.error: undefined
    });
  }

  genUrl(func, param, span, type, format){
    var target = 'json';
    var transformer = "table";
    var token = XP.token();

    if(type){
      target = type
    }

    if(format){
      transformer = format
    }

    let paramString =  $.param({
      func : func,
      "func-param": param,
      token: token,
      from: span.from,
      to: span.to,
      format: transformer
    }, true);
    return window.location.protocol + "//" + window.location.host + "/data/" + target + "?" + paramString
  }

  changeStatistic(){
    this._stats = null;
    this.onRefresh()
  }

  onRefresh() {
    this.pending();
    this.initSizeChangeMonitor();
    if(this.scheduler){
      clearTimeout(this.scheduler);
    }
    this.scheduler = setTimeout(this.refreshChart.bind(this), 1500);
  }

}

XPointChartCtrl.templateUrl = 'module.html';
