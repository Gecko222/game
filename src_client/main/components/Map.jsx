import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import axios from 'axios';

import { log } from '../libs/debug';
import { changePosition, startDrag, stopDrag, changeDestination, changePlayerPosition } from '../actions/map.js';
import { setError } from '../actions/error.js';
import MapElement from './MapElement.jsx';
import getMapState from '../selectors/mapSelector';


class Map extends Component {
	constructor(props) {
		super(props);

		this._requestAnimationFrameId = requestAnimationFrame(() => this._movePlayer());
		this._lastTick = 0;

	}

	render() {
		log('render', 'Map render');
		return (
			<div className="mapContainer" id="mapContainer" style={{width: `${this.props.size.width}px`,
				height: `${this.props.size.height}px`}}>
				<div className="map" onMouseLeave={(e) => this._onMouseLeave(e)} onMouseDown={(e) => this._onMouseDown(e)} onMouseMove={(e) => this._onMouseMove(e)} onMouseUp={(e) => this._onMouseUp(e)} style={{top: `${this.props.position.y}px`,
					left: `${this.props.position.x}px`}}>
					<img src="img/mapg.png" draggable="false" className="mapImage" />
					{this.props.mapElements.map(element =>
						<MapElement key={element.id} icon={element.icon} id={element.id} position={element.position} size={element.size}/>
					)}
					{this._renderDestination()}
					{this._renderPlayer()}
				</div>
			</div>
		);
	}

	_movePlayer() {
		let n = new Date().getTime();

		if (!this._lastTick ) {
			this._lastTick = n;
		}

		if (this.props.destination) {
			let x = this.props.destination.x - this.props.playerPosition.x;
			let y = this.props.destination.y - this.props.playerPosition.y;
			let speed = this.props.movementSpeed * ((n - this._lastTick) / 1000);
			let moveX = 0;
			let moveY = 0;

			if (x === 0 && y === 0) {
				this.props.changeDestination(false);
			} else {

				if (x > 0) {
					if (x < speed) {
						moveX += x;
					} else {
						moveX += speed;
					}
				} else if (x < 0) {
					if (x > -(speed)) {
						moveX = x;
					} else {
						moveX -= speed;
					}
				}

				if (y > 0) {
					if (y < speed) {
						moveY += y;
					} else {
						moveY += speed;
					}
				} else if (y < 0) {
					if (y > -(speed)) {
						moveY = y;
					} else {
						moveY -= speed;
					}
				}

				this.props.changePlayerPosition(
					(this.props.playerPosition.x + moveX),
					(this.props.playerPosition.y + moveY)
				);
			}
		}

		this._lastTick = n;
		this._requestAnimationFrameId = requestAnimationFrame(() => this._movePlayer());
	}

	_onMouseDown(e) {
		e.preventDefault();
		this.props.startDrag(e.pageX, e.pageY);
	}

	_mapClick(e) {
		let element = document.getElementById('mapContainer');
		let rect = element.getBoundingClientRect();
		let x = e.pageX - (rect.left + this.props.position.x);
		let y = e.pageY - (rect.top + this.props.position.y);

		log('map', 'Click coords: ', x, y);

		if (!this.props.inLocation) {
			this._changeDestination({
				x,
				y
			});
		}
	}

	_changeDestination(position) {
		axios.post('/game/request',
			{
				type: 'changeDestination',
				position
			},
			{
				method: 'post',
				timeout: 5000
			}
		)
			.then(response => {
				let data = response.data;

				if (data.errorMessage) {
					this.props.setError(`Błąd: ${data.errorMessage}`);
				}
				if (data.success) {
					this.props.changeDestination(position, data.movementSpeed);
				}
			})
			.catch(error => {
				log('errors', error);
				if (error && error.toString().includes('timeout')) {
					this.props.setError('Serwer nie odpowiada.');
				}
			});
	}

	_onMouseUp(e) {
		if (this.props.dragging) {
			if (!this.props.changed) {
				this._mapClick(e);
			}
			this.props.stopDrag();
		}
	}

	_onMouseLeave() {
		if (this.props.dragging) {
			this.props.stopDrag();
		}
	}

	_onMouseMove(e) {
		if (this.props.dragging) {
			if ((this.props.initial.y !== e.pageY) || (this.props.initial.x !== e.pageX)) {
				let top = this.props.position.y - (this.props.initial.y - e.pageY);
				let left = this.props.position.x - (this.props.initial.x - e.pageX) ;

				if (top > 0) {
					top = 0;
				}
				if (left > 0) {
					left = 0;
				}
				if (top < -(797-this.props.size.height)) {
					top = -(797-this.props.size.height);
				}
				if (left < -(1794-this.props.size.width)) {
					left = -(1794-this.props.size.width);
				}
				this.props.changePosition(left, top, e.pageX, e.pageY);
			}
		}
	}

	_renderDestination() {
		if (this.props.destination) {
			return <MapElement icon='destination' id='map_dest' position={this.props.destination} size={this.props.config.destSize} />;
		}
	}

	_renderPlayer() {
		if (this.props.playerPosition) {
			return <MapElement icon='destination' id='map_player' position={this.props.playerPosition} size={this.props.config.playerSize} />;
		}
	}

	static propTypes = {
		destination: PropTypes.oneOfType([
			PropTypes.shape({
				x: PropTypes.number.isRequired,
				y: PropTypes.number.isRequired
			}),
			PropTypes.bool
		]),
		position: PropTypes.shape({
			x: PropTypes.number.isRequired,
			y: PropTypes.number.isRequired
		}).isRequired,
		size: PropTypes.shape({
			height: PropTypes.number.isRequired,
			width: PropTypes.number.isRequired
		}).isRequired,
		initial: PropTypes.object.isRequired,
		config: PropTypes.object.isRequired,
		mapElements: PropTypes.array,
		dragging: PropTypes.bool,
		changed: PropTypes.bool,
		inLocation: PropTypes.bool,
		movementSpeed: PropTypes.number.isRequired,
		playerPosition: PropTypes.object.isRequired,
		changePlayerPosition: PropTypes.func.isRequired,
		changePosition: PropTypes.func.isRequired,
		changeDestination: PropTypes.func.isRequired,
		setError: PropTypes.func.isRequired,
		startDrag: PropTypes.func.isRequired,
		stopDrag: PropTypes.func.isRequired,
	};
}

let mapStateToProps  = (state, props) => {
	return {
		...getMapState(state, props),
		config: { ...state.config },
		inLocation: state.player.inLocation
	};
};

let mapDispatchToProps = (dispatch) => {
	return {
		changePosition: (x, y, ix, iy) => {
			dispatch(changePosition(x, y, ix, iy));
		},
		startDrag: (x, y) => {
			dispatch(startDrag(x, y));
		},
		stopDrag: () => {
			dispatch(stopDrag());
		},
		changeDestination: (position, speed) => {
			dispatch(changeDestination(position, speed));
		},
		setError: (msg, details = false, critical = false) => {
			dispatch(setError(msg, details, critical));
		},
		changePlayerPosition: (x, y) => {
			dispatch(changePlayerPosition({ x,
				y }));
		}
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(Map);
