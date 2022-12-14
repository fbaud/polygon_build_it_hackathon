import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Dropdown, DropdownButton, FormGroup, FormControl, FormLabel, InputGroup } from 'react-bootstrap';

import PropTypes from 'prop-types';

import { faCopy, faUndo} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import CurrencyCardIcon from '../../common/utils/currency-card-icon.js';


import ClauseListView from '../clause/clause-list-view.js'

class DeedView extends React.Component {
	
	constructor(props) {
		super(props);
		
		this.app = this.props.app;
		this.getMvcModuleObject = this.app.getMvcModuleObject;
		this.getMvcMyQuoteObject = this.app.getMvcMyQuoteObject;

		this.dataobject = null;

		this.deed = null;

		
		let mintername = '';

		let title = '';
		let description = '';
		let tokenuri = '';

		let currency = {symbol: ''};
		let currencies= [];

		let deedcard = null;
		
		this.closing = false;
		
		this.state = {
			mintername,

			title,
			description,
			tokenuri,

			currency,
			currencies,
			deedcard,

			isOwner: false,
			loaded: false,
			registration_text: 'loading...',
			registration_signature: 'loading...',
			message_text: 'loading...',
			sharelinkmessage: 'loading...',
			sharelink: 'loading...'
		}
	}


	_setState(state) {
		if (this.closing !== true)
		this.setState(state);
	}

	
	// post render commit phase
	componentDidMount() {
		console.log('DeedView.componentDidMount called');
		
		let mvcmyquote = this.getMvcMyQuoteObject();

		let registration_text = mvcmyquote.t('This deed has been registered.');

		let message_text = mvcmyquote.t(
			'This deed represents some rights that are potentially conferred to the owner of the deed. \
			Ownership can be asserted by the possession of the private key registered as owner of the deed. \
			If you haven\'t yet provided a private key for the corresponding currency, \
			you can add your private key through the currency cards menu. \
			If you provide a private key, it will be crypted and stored on your device, it will not leave \
			your device at any time and will not be shared with anyone. \
			This deed is registered and is accessible to anyone by clicking on \
			the link that has been generated. \
			Send this link to anyone to share the exact description of this deed.');
	
		let sharelinkmessage = mvcmyquote.t('You can share this deed with the following link:');
		
		
		this._setState({registration_text, message_text, sharelinkmessage});

		this.checkNavigationState().catch(err => {console.log('error in DeedView.checkNavigationState: ' + err);});
	}


	async checkNavigationState() {
		let mvcmyquote = this.getMvcMyQuoteObject();

		let rootsessionuuid = this.props.rootsessionuuid;
		let walletuuid = this.props.currentwalletuuid;

		let app_nav_state = this.app.getNavigationState();
		let app_nav_target = app_nav_state.target;

		if (app_nav_target && (app_nav_target.route == 'deed') && (app_nav_target.reached == false)) {
			var params = app_nav_target.params;
			var dataobj = params.dataobject;

			if (dataobj && (dataobj.type === 'deed') && (dataobj.treated !== true)) {
				this.dataobject = dataobj;

				let currencyuuid = (params.currencyuuid ? params.currencyuuid : dataobj.currencyuuid);
				let txhash = (params.txhash ? params.txhash : dataobj.txhash);

				let minter_address = (params.address ? params.address : dataobj.minter);
				let tokenid = (params.tokenid ? params.tokenid : dataobj.tokenid);

				// we fetch the deed to have a proper record
				let minter = await mvcmyquote.fetchDeedMinterFromAddress(rootsessionuuid, walletuuid, currencyuuid, minter_address);

				if (!minter)
					throw 'could not find minter with address ' + minter_address;

				let mintername = minter.name;

				let deed = await mvcmyquote.fetchDeed(rootsessionuuid, walletuuid, currencyuuid, minter, tokenid);
				this.deed = deed;

				// time
				let registration_time = (deed.metadata ? deed.metadata.time/1000 : null);
				let registration_text = mvcmyquote.t('This deed has been registered on');

				registration_text += ' ' + (registration_time ? mvcmyquote.formatDate(registration_time, 'YYYY-mm-dd HH:MM:SS') : mvcmyquote.t(': missing')) + '.';
				
				let registration_signature = (deed.metadata.signature && deed.metadata.signature ? deed.metadata.signature : mvcmyquote.t('missing'));
	
				// share link
				let currency = await mvcmyquote.getCurrencyFromUUID(rootsessionuuid, currencyuuid)
				.catch(err => {
					console.log('error in DeedView.checkNavigationState: ' + err);
				});

				if (!currency)
					return Promise.reject('could not find currency ' + currencyuuid);
	
				var sharelink = await this.app.getShareLink(txhash, currency.uuid);
	
				let isOwner = false;
				
				let deedcard = await mvcmyquote.getDeedOwningCard(rootsessionuuid, walletuuid, currencyuuid, minter, deed).catch(err => {});
				if (deedcard) {
					isOwner = true;
				}

				this._setState({currency, mintername, isOwner, deedcard, 
					registration_text, registration_signature, sharelink});

				dataobj.viewed = true;
			}

			// mark target as reached
			app_nav_target.reached = true;
		}

		if (this.deed) {
			let deed = this.deed;

			let deedowner = deed.owner;
			let tokenuri = deed.tokenuri;

			let title = (deed.metadata && deed.metadata.title ? deed.metadata.title : '');
			let description = (deed.metadata && deed.metadata.description ? deed.metadata.description : '');
			let external_url = (deed.metadata && deed.metadata.external_url ? deed.metadata.external_url : '');

			this._setState({tokenuri, deedowner, title, description, external_url});
		}

		this._setState({loaded: true});
	}

 	// end of life
	componentWillUnmount() {
		console.log('DeedView.componentWillUnmount called');
		
		this.closing = true;
	}
	
	
	// user actions
	async onBack() {
		console.log('onBack pressed!');

		let currencyuuid = this.deed.currencyuuid;
		
		let params = {action: 'view', currencyuuid};
	
		await this.app.gotoRoute('deeds', params);
	}

	async onAddClause() {
		console.log('onAddClause pressed!');
		
		if (this.dataobject) {
			let params = {action: 'create', txhash: this.dataobject.txhash, currencyuuid: this.dataobject.currencyuuid, dataobject: this.dataobject};
			this.app.gotoRoute('clause', params);
		}
		else
			this.app.alert('Deed parameters not found');

		return true;
	}

	async onTransfer() {
		console.log('onTransfer pressed!');
		
		let params = {action: 'transfer', currencyuuid: this.dataobject.currencyuuid, txhash: this.dataobject.txhash, address: this.deed.minter, tokenid: this.deed.tokenid, dataobject: this.deed};

		await this.app.gotoRoute('deed', params);		
		
		return true;
	}


	async onShareLinkClick() {
		const {sharelink} = this.state;
		
		// create a textarea on the fly, then remove it to
		// be able to copy to clipboard
		var textArea = document.createElement("textarea");
		textArea.value = sharelink;

		document.body.appendChild(textArea);
		textArea.select();
		document.execCommand("Copy");
		textArea.remove();

		this.app.alert("Share link has been copied to clipboard");
	}

	async onTokenURIClick() {
		const {tokenuri} = this.state;
		
		// create a textarea on the fly, then remove it to
		// be able to copy to clipboard
		var textArea = document.createElement("textarea");
		textArea.value = tokenuri;

		document.body.appendChild(textArea);
		textArea.select();
		document.execCommand("Copy");
		textArea.remove();

		this.app.alert("Token URI has been copied to clipboard");
	}

	async onExternalURLClick() {
		const {external_url} = this.state;
		
		// create a textarea on the fly, then remove it to
		// be able to copy to clipboard
		var textArea = document.createElement("textarea");
		textArea.value = external_url;

		document.body.appendChild(textArea);
		textArea.select();
		document.execCommand("Copy");
		textArea.remove();

		this.app.alert("Asset url has been copied to clipboard");
	}

	
	// rendering
	renderDeedButtons() {
		let { loaded, isOwner} = this.state;

		if (loaded) {
			return(
				<div className="DeedButtonsLine">
				<span className="DeedButton">
				<Button onClick={this.onAddClause.bind(this)} 
				disabled={(isOwner ? false : true)} 
				variant={(isOwner ? "primary" : "secondary")} 
				type="submit">
				Add a clause</Button>
				</span>
				<span className="DeedButton">
				<Button onClick={this.onTransfer.bind(this)} 
				disabled={(isOwner ? false : true)} 
				variant={(isOwner ? "primary" : "secondary")} 
				type="submit">
				Transfer</Button>
				</span>
				</div>
			);
		}
		else {
			return(	
				<div className="DeedButtonsLine">
				<span className="DeedButton">
				<Button disabled type="submit">
					loading...
				</Button>
				</span>
				<span className="DeedButton">
				<Button disabled type="submit">
				loading...
				</Button>
				</span>
				</div>
		);
		}
	}

	renderDeedView() {
		let { isOwner, deedowner, mintername, title, description, currency, registration_text, registration_signature, message_text, sharelinkmessage, sharelink, tokenuri, external_url } = this.state;
		
		return (
			<div className="Form">
			
				<FormGroup controlId="currency">
				<FormLabel>Currency</FormLabel>
				<FormControl
					disabled
					autoFocus
					type="text"
					value={(currency ? currency.symbol : '')}
					onChange={e => this._setState({currencysymbol: e.target.value})}
				/>
			  	</FormGroup>


				<FormGroup controlId="mintername">
				  <FormLabel>Minter Name</FormLabel>
				  <FormControl
					disabled
					autoFocus
					type="text"
					value={mintername}
					onChange={e => this._setState({mintername: e.target.value})}
				  />
				</FormGroup>

				<FormGroup controlId="title">
				  <FormLabel>Deed Title</FormLabel>
				  <FormControl
					disabled
					autoFocus
					type="text"
					value={title}
					onChange={e => this._setState({title: e.target.value})}
				  />
				</FormGroup>

				<FormGroup controlId="description">
				  <FormLabel>Description</FormLabel>
				  <FormControl 
					disabled
					as="textarea" 
					rows="5" 
					autoFocus
					type="text"
					value={description}
					onChange={e => this._setState({description: e.target.value})}
				  />
				</FormGroup>
				
				<FormGroup controlId="asseturl">
				  <FormLabel>Asset url</FormLabel>
				  <div className="ShareBlock">
				  <span className="ShareLink" onClick={this.onExternalURLClick.bind(this)}>{external_url}</span>
				  <span className="ShareIcon" onClick={this.onExternalURLClick.bind(this)}><FontAwesomeIcon icon={faCopy} /></span>
				  </div>
				</FormGroup>

				{(isOwner ? <div className="Separator"><span>you are the owner</span></div> : <div className="Separator"><span>you are not the owner</span></div>)}

				{this.renderDeedButtons()}

				<div className="TextBox">
				  <div>{registration_text}</div>
				  <div>With card:&nbsp;<span>{deedowner}</span></div>
				  <div>Signature:&nbsp;<span className="DeedSignature">{registration_signature}</span></div>
			  	</div>

				<div className="TextBox">
					<div>{sharelinkmessage}</div>
					<div className="ShareBlock">
					<span className="ShareLink" onClick={this.onShareLinkClick.bind(this)}>{sharelink}</span>
					<span className="ShareIcon" onClick={this.onShareLinkClick.bind(this)}><FontAwesomeIcon icon={faCopy} /></span>
					</div>
				</div>

				<div className="TextBox">
				  {message_text}
			  	</div>


				{(this.dataobject ?
				<div>
				<hr></hr>
				<div>
					{(this.deed ?<ClauseListView app={this.app} deed={this.deed} /> : <></> )}	
				</div>
				</div> :
				<></>
				)}
			</div>
		  );
	}


	render() {
		return (
			<div className="Container">
				<div className="TitleBanner">
				<div className="Title">Deed View</div>
				<div className="BackIcon" onClick={this.onBack.bind(this)}><FontAwesomeIcon icon={faUndo} /></div>
				</div>
				{ this.renderDeedView()}
			</div>
		  );
	}
	
}


// propTypes validation
DeedView.propTypes = {
	app: PropTypes.object.isRequired,
	rootsessionuuid: PropTypes.string,
	currentwalletuuid: PropTypes.string,
	iswalletlocked: PropTypes.bool,
};

//redux
const mapStateToProps = (state) => {
	return {
		rootsessionuuid: state.session.sessionuuid,
		pending: state.login.pending,
		success: state.login.success,
		lasterror: state.login.error,
		currentwalletuuid: state.wallets.walletuuid,
		iswalletlocked: state.wallets.islocked,
	};
}

const mapDispatchToProps = (dispatch) => {
	return {
	};
}


export {DeedView};
export default connect(mapStateToProps, mapDispatchToProps)(DeedView);

