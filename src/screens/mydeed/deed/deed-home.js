import React, { Component } from 'react';

import PropTypes from 'prop-types';

import Header from '../../../navigation/header/header.js';

import DeedCreateForm from '../../../components/mydeed/deed/deed-create-form.js';
import DeedTransferForm from '../../../components/mydeed/deed/deed-transfer-form.js';
import DeedView from '../../../components/mydeed/deed/deed-view.js';

class DeedHomeScreen extends React.Component {
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
		console.log('DeedHomeScreen.componentDidMount called');
		let mvcmyquote = this.app.getMvcMyQuoteObject();
		
		mvcmyquote.registerEventListener('on_refreshPage', this.uuid, this.onRefreshPage.bind(this));
		
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

	async onRefreshPage() {
		console.log('DeedHomeScreen.onRefreshPage called');

		return this.checkNavigationState().catch(err => {console.log('error in checkNavigationState: ' + err);});
	}
	
	// end of life
	componentWillUnmount() {
		console.log('DeedHomeScreen.componentWillUnmount called');
		let app = this.app;
		let mvcmyquote = this.getMvcMyQuoteObject();
		
		mvcmyquote.unregisterEventListener('on_refreshPage', this.uuid);
	}

	renderDeedView() {
		switch(this.state.action) {
			case 'view':
				return (<DeedView app = {this.app}/>);
			case 'create':
				return (<DeedCreateForm app = {this.app}/>);
			case 'transfer':
				return (<DeedTransferForm app = {this.app}/>);
			default:
				return (<div>Error, wrong action {this.state.action}</div>);
		}
	}
	
	
	render() {
		let {loaded, action, deedinfo, txhash} = this.state;

		return (
			<div className="Screen">
				<Header app = {this.app} />
				{(loaded === true ?
				this.renderDeedView() :
				<div>{deedinfo}</div>
				)}
			</div>
		);
	}
}

// propTypes validation
DeedHomeScreen.propTypes = {
	app: PropTypes.object.isRequired,
};



export default DeedHomeScreen;