(function() {
  window.shared || (window.shared = {});
  const dom = window.shared.ReactHelpers.dom;
  const createEl = window.shared.ReactHelpers.createEl;
  const merge = window.shared.ReactHelpers.merge;

  const ProfileChart = window.shared.ProfileChart;
  const ProfileChartSettings = window.ProfileChartSettings;

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
      borderBottom: '1px solid #333',
      position: 'absolute',
      top: 30,
      left: 30,
      right: 30
    },
    navBar: {
      fontSize: 18
    },
    navTop: {
      textAlign: 'right',
      verticalAlign: 'text-top'
    }
  };

  /*
  This renders details about ELA performance and growth in the student profile page.
  It's mostly historical charts.

  On charts, we could filter out older values, since they're drawn outside of the visible projection
  area, and Highcharts hovers look a little strange because of that.  It shows a bit more
  historical context though, so we'll keep all data points, even those outside of the visible
  range since interpolation lines will still be visible.
  */
  const ELADetails = window.shared.ELADetails = React.createClass({
    displayName: 'ELADetails',

    propTypes: {
      chartData: React.PropTypes.shape({
        star_series_reading_percentile: React.PropTypes.array.isRequired,
        mcas_series_ela_scaled: React.PropTypes.array.isRequired,
        mcas_series_ela_growth: React.PropTypes.array.isRequired
      }).isRequired,
      student: React.PropTypes.object.isRequired
    },

    render: function() {
      return (
        <div className="ELADetails">
          {this.renderNavBar()}
          {this.renderStarReading()}
          {this.renderMCASELAScores()}
          {this.renderMCASELAGrowth()}
        </div>
      );
    },

    renderNavBar: function() {
      return (
        <div style={styles.navBar}>
          <a style={styles.navBar} href="#Star">
            STAR Reading Chart
          </a>
          {' | '}
          <a style={styles.navBar} href="#Scores">
            MCAS ELA Scores Chart
          </a>
          {' | '}
          <a style={styles.navBar} href="#SGPs">
            MCAS ELA SGPs Chart
          </a>
        </div>
      );
    },

    renderHeader: function(title) {
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

    renderStarReading: function() {
      return (
        <div id="Star" style={styles.container}>
          {this.renderHeader('STAR Reading, last 4 years')}
          <ProfileChart
            quadSeries={[{
              name: 'Percentile rank',
              data: this.props.chartData.star_series_reading_percentile
            }]}
            titleText=""
            student={this.props.student}
            yAxis={merge(this.percentileYAxis(), {
              title: { text: 'Percentile rank' }
            })} 
            showGradeLevelEquivalent= { true }/>
        </div>
      );
    },

    renderMCASELAScores: function() {
      return (
        <div id="Scores" style={styles.container}>
          {this.renderHeader('MCAS ELA Scores, last 4 years')}
          <ProfileChart
            quadSeries={[{
              name: 'Scaled score',
              data: this.props.chartData.mcas_series_ela_scaled
            }]}
            titleText=""
            student={this.props.student}
            yAxis={merge(ProfileChartSettings.default_mcas_score_yaxis,{
              plotLines: ProfileChartSettings.mcas_level_bands,
              title: { text: 'Scaled score' }
            })} />
        </div>
      );
    },

    renderMCASELAGrowth: function() {
      return (
        <div id="SGPs" style={styles.container}>
          {this.renderHeader('Student growth percentile (SGP), last 4 years')}
          <ProfileChart
            quadSeries={[{
              name: '',
              data: this.props.chartData.mcas_series_ela_growth
            }]}
            titleText="MCAS ELA SGPs, last 4 years"
            student={this.props.student}
            yAxis={merge(this.percentileYAxis(), {
              title: { text: 'Student growth percentile (SGP)' }
            })} />
        </div>
      );
    },

    // TODO(er) factor out
    percentileYAxis: function() {
      return merge(ProfileChartSettings.percentile_yaxis, {
        plotLines: [{
          color: '#666',
          width: 1,
          zIndex: 3,
          value: 50,
          label: {
            text: '50th percentile',
            align: 'center',
            style: {
              color: '#999999'
            }
          }
        }]
      });
    }
  });
})();
