import React, { Component } from 'react';

import PropTypes from 'prop-types';

import Header from '../../../navigation/header/header.js';

import DeedListView from '../../../components/mydeed/deed/deed-list-view.js';

class DeedListScreen extends React.Component {
	constructor(props) {
		super(props);
		
		this.app = this.props.app;
		this.getMvcModuleObject = this.app.getMvcModuleObject;
		this.getMvcMyQuoteObject = this.app.getMvcMyQuoteObject;
		
		this.uuid = this.app.guid();
		
		
		this.state = {
			action: 'create',
			txhash: null,
			loaded: false,
			deedinfo: 'loading...'
		};
	}
	
	// post render commit phase
	componentDidMount() {
		console.log('DeedListScreen.componentDidMount called');
		
		this.checkNavigationState().catch(err => {console.log('error in checkNavigationState: ' + err);});
	}

	async checkNavigationState() {
		let mvcmyquote = this.getMvcMyQuoteObject();

		let rootsessionuuid = this.props.rootsessionuuid;

		let app_nav_state = this.app.getNavigationState();
		let app_nav_target = app_nav_state.target;

		if (app_nav_target && (app_nav_target.route == 'deed') && (app_nav_target.reached == false)) {
			var params = app_nav_target.params;

			if (params) {
				let txhash = params.txhash;
				let deedinfo = '';
				let action = (params.action ? params.action : 'create');
	
				if (txhash) {
					// retrieve info from firenze
					deedinfo = txhash;
				}
	
				this.setState({action, txhash, deedinfo});
			}

			// DeedView will take care of marking target reached
		}

		this.setState({loaded: true});
	}
	
	// end of life
	componentWillUnmount() {
		console.log('DeedListScreen.componentWillUnmount called');
		let app = this.app;
		let mvcmyquote = this.getMvcMyQuoteObject();
		
	}
	
	
	render() {
		let {loaded, action, deedinfo, txhash} = this.state;

		return (
			<div className="Screen">
				<Header app = {this.app} />
				{(loaded === true ?
				<DeedListView app = {this.app} /> :
				<div>{deedinfo}</div>
				)}

			</div>
		);
	}
}

// propTypes validation
DeedListScreen.propTypes = {
	app: PropTypes.object.isRequired,
};



export default DeedListScreen;