(function() {
  window.shared || (window.shared = {});
  const dom = window.shared.ReactHelpers.dom;
  const createEl = window.shared.ReactHelpers.createEl;
  const merge = window.shared.ReactHelpers.merge;

  const HighchartsWrapper = window.shared.HighchartsWrapper;

  const styles = {
    title: {
      color: 'black',
      paddingBottom: 20,
      fontSize: 24
    },
    container: {
      width: '100%',
      marginTop: 50,
      marginLeft: 'auto',
      marginRight: 'auto',
      border: '1px solid #ccc',
      padding: '30px 30px 30px 30px',
      position: 'relative'
    },
    secHead: {
      display: 'flex',
      justifyContent: 'space-between',
      position: 'absolute',
      top: 30,
      left: 30,
      right: 30
    },
    navTop: {
      textAlign: 'right',
      verticalAlign: 'text-top'
    }
  };

  // A function that grabs a monthKey from an event that is passed in.  Should return
  // a string in the format YYYYMMDD for the first day of the month.
  // Used for grouping events on the chart.
  function defaultMonthKeyFn(event) {
    return moment.utc(event.occurred_at).date(1).format('YYYYMMDD');
  };

  // Component for all charts in the profile page.
  window.shared.ProfileBarChart = React.createClass({
    displayName: 'ProfileChart',

    propTypes: {
      id: React.PropTypes.string.isRequired, // short string identifier for links to jump to
      events: React.PropTypes.array.isRequired, // array of JSON event objects.
      monthsBack: React.PropTypes.number.isRequired, // how many months in the past to display?
      tooltipTemplateString: React.PropTypes.string.isRequired, // Underscore template string that displays each line of a tooltip.
      titleText: React.PropTypes.string.isRequired,
      nowMomentUTC: React.PropTypes.instanceOf(moment),
      monthKeyFn: React.PropTypes.func,
      phaselines: React.PropTypes.array
    },

    getDefaultProps: function(){
      return {
        tooltipTemplateString: "<span><%= moment.utc(e.occurred_at).format('MMMM Do, YYYY')%></span>",
        phaselines: [],
        nowMomentUTC: moment.utc(),
        monthKeyFn: defaultMonthKeyFn
      }
    },

    // Returns a list of monthKeys that are within the time window for this chart.
    monthKeys: function(nowMomentUTC, monthsBack) {
      const lastMonthMomentUTC = nowMomentUTC.clone().date(1);
      return _.range(monthsBack, -1, -1).map(function(monthsBack) {
        const monthMomentUTC = lastMonthMomentUTC.clone().subtract(monthsBack, 'months');
        const monthKey = monthMomentUTC.format('YYYYMMDD');
        return monthKey;
      }, this);
    },

    // Given a list of monthKeys, map over that to return a list of all events that fall within
    // that month.
    eventsToMonthBuckets: function(monthKeys, events){
      const eventsByMonth = _.groupBy(events, this.props.monthKeyFn);
      return monthKeys.map(function(monthKey) {
        return eventsByMonth[monthKey] || [];
      });
    },

    // Returns HighCharts categories map, which describes how to place year captions in relation
    // to the list of monthKeys.  Returns a map of (index into monthKeys array) -> (caption text)
    //
    // Example output: {3: '2014', 15: '2015'}
    yearCategories: function(monthKeys) {
      const categories = {};

      monthKeys.forEach(function(monthKey, monthKeyIndex) {
        const monthMomentUTC = moment.utc(monthKey);
        const isFirstMonthOfYear = (monthMomentUTC.date() === 1 && monthMomentUTC.month() === 0);
        if (isFirstMonthOfYear) {
          categories[monthKeyIndex] = this.yearAxisCaption(monthKey);
        }
      }, this);

      return categories;
    },

    // Compute the month range that's relevant for the current date and months back we're showing
    // on the chart.  Then map each month onto captions, and bucket the list of events into
    // each month.
    render: function() {
      const monthKeys = this.monthKeys(this.props.nowMomentUTC, this.props.monthsBack);
      const monthBuckets = this.eventsToMonthBuckets(monthKeys, this.props.events);
      const yearCategories = this.yearCategories(monthKeys);

      return (
        <div id={this.props.id} style={styles.container}>
          {this.renderHeader()}
          <HighchartsWrapper
            chart={{type: 'column'}}
            credits={false}
            xAxis={[
              {
                categories: monthKeys.map(this.monthAxisCaption),
                plotLines: this.makePlotlines(monthKeys)
              },
              {
                offset: 35,
                linkedTo: 0,
                categories: yearCategories,
                tickPositions: Object.keys(yearCategories).map(Number),
                tickmarkPlacement: "on"
              }
            ]}
            title={{text: ''}}
            yAxis={{
                min: 0,
                max: 20,
                allowDecimals: false,
                title: {text: this.props.titleText}
            }}
            tooltip={{
              formatter: this.createUnsafeTooltipFormatter(monthBuckets, this.props),
              useHTML: true
            }}
            series={[
              {
                showInLegend: false,
                data: _.map(monthBuckets, 'length')
              }
            ]} />
        </div>
      );
    },

    makePlotlines: function (monthKeys) {
      return this.props.phaselines.map(function(phaseline) {
        const phaselineMonthKey = phaseline.momentUTC.clone().date(1).format('YYYYMMDD');
        const monthIndex = monthKeys.indexOf(phaselineMonthKey);

        return {
          color: '#ccc',
          value: monthIndex,
          width: 2,
          zIndex: 10,
          label: {
            text: phaseline.text,
            align: 'left',
          }
        };
      });
    },

    renderHeader: function() {
      const nYearsBack = Math.ceil(this.props.monthsBack / 12);
      const title = this.props.titleText + ', last ' + nYearsBack + ' years';

      return (
        <div style={styles.secHead}>
          <h4 style={styles.title}>
            {title}
          </h4>
          <span style={styles.navTop}>
            <a href="#">
              Back to top
            </a>
          </span>
        </div>
      );
    },

    // This returns a function, since HighCharts passes in the current element
    // as `this` instead of a parameter.
    createUnsafeTooltipFormatter: function(monthBuckets, props){
      return function() {
        const graphPointIndex = this.series.data.indexOf(this.point);
        const events = monthBuckets[graphPointIndex];
        if (events.length == 0) return false;

        let htmlstring = "";
        _.each(events, function(e){
          htmlstring += _.template(props.tooltipTemplateString)({e: e});
          htmlstring += "<br>";
        });
        return htmlstring;
      };
    },

    monthAxisCaption: function(monthKey) {
      return moment.utc(monthKey).format('MMM');
    },

    yearAxisCaption: function(monthKey) {
      return moment.utc(monthKey).format('YYYY');
    }
  });
})();