const setLocationType = (type) => {
	return {
		type: 'setLocationType',
		locationType: type
	};
};

/* DUNGEON_MAP */
const setLocationMap = (map) => {
	return {
		type: 'LocationSetMap',
		map
	};
};

const setPlayerPosition = (position) => {
	return {
		type: 'LocationSetPlayerPosition',
		position
	};
};

const changePlayerPosition = (position) => {
	return {
		type: 'LocationSetPlayerPosition',
		position
	};
};
/* END DUNGEON_MAP */

module.exports = {
	setLocationType,
	setLocationMap,
	setPlayerPosition,
	changePlayerPosition
};