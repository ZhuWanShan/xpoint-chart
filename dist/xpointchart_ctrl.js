'use strict';

System.register(['app/plugins/sdk', 'jquery', 'lodash', 'moment'], function (_export, _context) {
  "use strict";

  var MetricsPanelCtrl, $, _, moment, _createClass, XPointChartCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsSdk) {
      MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
    }, function (_jquery) {
      $ = _jquery.default;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_moment) {
      moment = _moment.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('XPointChartCtrl', XPointChartCtrl = function (_MetricsPanelCtrl) {
        _inherits(XPointChartCtrl, _MetricsPanelCtrl);

        function XPointChartCtrl($scope, $injector, $rootScope) {
          _classCallCheck(this, XPointChartCtrl);

          var _this = _possibleConstructorReturn(this, (XPointChartCtrl.__proto__ || Object.getPrototypeOf(XPointChartCtrl)).call(this, $scope, $injector));

          _this.$rootScope = $rootScope;

          if (!_this.panel.statisticName) {
            _this.panel.statisticName = 'test';
          }

          _this.spinTemplate = "<span id='spin_" + _this.xpointId + "' class='panel-loading'><i class='fa fa-spinner fa-spin'></i></span>";

          _this.events.on('refresh', _this.onRefresh.bind(_this));
          _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
          return _this;
        }

        _createClass(XPointChartCtrl, [{
          key: 'initSizeChangeMonitor',
          value: function initSizeChangeMonitor() {
            if (!this.sizeChangeMonitorInitialized) {
              this.sizeH = this.rootPanel().height();
              this.sizeW = this.rootPanel().width();
              var self = this;
              this.rootPanel().css("-moz-transition", "width 0.01s, height 0.01s").css("-webkit-transition", "width 0.01s, height 0.01s").css("-o-transition:width", "width 0.01s, height 0.01s").css("transition", "width 0.01s, height 0.01s").on("webkitTransitionEnd transitionend oTransitionEnd", function () {
                if (Math.abs(self.sizeH - self.rootPanel().height()) > 1 || Math.abs(self.sizeW - self.rootPanel().width()) > 1) {
                  self.contentPanel().hide();
                  self.onRefresh();
                }
              });
              this.rootPanel().find('.resize-panel-handle').mousedown(function () {
                self.contentPanel().hide();
              }).mouseup(function () {
                self.onRefresh();
              });
              this.sizeChangeMonitorInitialized = true;
            }
          }
        }, {
          key: 'rootPanel',
          value: function rootPanel() {
            var row = this.dashboard.rows.indexOf(this.row);
            var col = this.row.panels.indexOf(this.panel);
            return $($($($(".dash-row")[row]).find(".panel")[col]));
          }
        }, {
          key: 'contentPanel',
          value: function contentPanel() {
            return this.rootPanel().find('.panel-content');
          }
        }, {
          key: 'createChartPanel',
          value: function createChartPanel() {
            var myParent = this.contentPanel();

            var panel = myParent.find(".graph-canvas-wrapper");
            panel.height(this.rootPanel().find(".panel-container").height() - 20);
            panel.width(this.rootPanel().find(".panel-container").innerWidth() - 20);

            return panel;
          }
        }, {
          key: 'pending',
          value: function pending() {
            if (!this.isPending) {
              if ($('#spin_' + this.xpointId).length < 1) {
                var target = this.rootPanel().find(".panel-loading");
                $(this.spinTemplate).insertBefore(target);
              }
              this.isPending = true;
            }
          }
        }, {
          key: 'complete',
          value: function complete() {
            this.contentPanel().show();
            var id = '#spin_' + this.xpointId;
            $(id).remove();
            this.sizeH = this.rootPanel().height();
            this.sizeW = this.rootPanel().width();
            this.isPending = false;
          }
        }, {
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            this.addEditorTab('Options', 'public/plugins/xpoint-chart/editor.html');
            this.editorTabs[1] = this.editorTabs[this.editorTabs.length - 1];
            this.editorTabs.pop();
          }
        }, {
          key: 'context',
          value: function context() {
            var self = this;
            var ONE_HOUR = 3600 * 1000;
            var ONE_DAY = 84000 * 1000;

            var param = {};

            _.forEach(this.templateSrv.variables, function (it) {
              param[it.name] = {
                value: it.current.value,
                text: it.current.text
              };
            });

            var timeRange = this.range;

            if (timeRange && timeRange.from && timeRange.to) {
              timeRange.from = parseInt(timeRange.from / ONE_HOUR) * ONE_HOUR;
              timeRange.to = parseInt(timeRange.to / ONE_HOUR) * ONE_HOUR;
            } else {
              timeRange.to = parseInt(moment().toDate().getTime() / ONE_HOUR) * ONE_HOUR;
              timeRange.from = timeRange.to - ONE_DAY * 7;
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
        }, {
          key: 'stats',
          value: function stats() {
            return this.templateSrv.replace(this.panel.statisticName, this.panel.scopedVars, 'pipe');
          }
        }, {
          key: 'refreshChart',
          value: function refreshChart() {
            var stats = this.stats();
            var ctx = this.context();
            var el = this.createChartPanel()[0];
            var self = this;

            if (!_.isEqual(self._stats, stats) || self.chart == undefined) {
              self.pending();
              self._stats = stats;
              var statsLocation = 'chart/' + self._stats;

              if (!_.isEqual(self._stats, stats)) {
                console.log("Stats Changed, from " + self._stats + " to " + stats);
              } else {
                console.log("First Time init " + self._stats);
              }

              requirejs([statsLocation], function (chart) {
                try {
                  self.chart = chart(self, el);
                  self.chart.create(ctx);
                } catch (e) {
                  console.log(e);
                  $(el).html("Faild to Load " + stats);
                  self.complete();
                }
              });
            } else if (!_.isEqual(self._context, ctx)) {
              self.chart.onContextChange(ctx, self._context);
              self._context = ctx;
            } else {
              self.chart.onContextChange(ctx, self._context);
              console.log("Nothing Changed");
            }
          }
        }, {
          key: 'fetchData',
          value: function fetchData(hook, func, param, span, type, format) {
            var url = this.genUrl(func, param, span, type, format);
            $.ajax({
              url: url,
              dataType: "json",
              success: hook ? hook.success : undefined,
              error: hook ? hook.error : undefined
            });
          }
        }, {
          key: 'genUrl',
          value: function genUrl(func, param, span, type, format) {
            var target = 'json';
            var transformer = "table";
            var token = XP.token();

            if (type) {
              target = type;
            }

            if (format) {
              transformer = format;
            }

            var paramString = $.param({
              func: func,
              "func-param": param,
              token: token,
              from: span.from,
              to: span.to,
              format: transformer
            }, true);
            return window.location.protocol + "//" + window.location.host + "/data/" + target + "?" + paramString;
          }
        }, {
          key: 'changeStatistic',
          value: function changeStatistic() {
            this._stats = null;
            this.onRefresh();
          }
        }, {
          key: 'onRefresh',
          value: function onRefresh() {
            this.pending();
            this.initSizeChangeMonitor();
            if (this.scheduler) {
              clearTimeout(this.scheduler);
            }
            this.scheduler = setTimeout(this.refreshChart.bind(this), 1500);
          }
        }]);

        return XPointChartCtrl;
      }(MetricsPanelCtrl));

      _export('XPointChartCtrl', XPointChartCtrl);

      XPointChartCtrl.templateUrl = 'module.html';
    }
  };
});
//# sourceMappingURL=xpointchart_ctrl.js.map
