import { Component } from '@nestjs/common';
import { InjectRepository } from '../../../../db';
import { EntityManager, Repository } from 'typeorm';
import { find, reduce, filter, findIndex, isArray } from 'lodash';
import { log } from '../../../../logger';

import { ILocationService } from '../../interfaces/location-service.interface';

import { ItemsService } from '../../../items';

import { Dungeon } from './dungeon.entity';
import { Player } from '../../../player/player.entity';

import { MapPosition } from '../../../map/interfaces/map-position.interface';
import { MapIcon } from '../../../map/interfaces/map-icon.enum';

import { IRoom } from './interfaces/room.interface';

import itemsGenerator from './utils/items-generator.utility';

@Component()
export class DungeonService extends ILocationService {
	static dependecies = [];

	dungeons: Dungeon[] = [];

	constructor(
		@InjectRepository(Dungeon)
		private readonly dungeonRepository: Repository<Dungeon>,
		private readonly entityManager: EntityManager,
		private readonly itemsService: ItemsService
	) {
		super();
	}

	getLocationName() {
		return Dungeon.name;
	}

	async create(
		visibilityRules: any,
		data?: {player: Player},
		icon: MapIcon = MapIcon.BUILDING,
		isPerm: boolean = false
	) {
		const dungeon = this.dungeonRepository.create({ isPerm });

		dungeon.generateRooms();
		dungeon.rooms =  await itemsGenerator(this.itemsService, dungeon.rooms);

		await this.entityManager.save(dungeon);

		return dungeon;
	}

	loadLocation(location: Dungeon): boolean {
		if (location.constructor.name !== Dungeon.name) {
			log('error', `${location} is not Dungeon instance:`);
			log('error', location);
			return false;
		}

		if (find(this.dungeons, pa => pa.id === location.id)) {
			log('debug', `Dungeon ${location.id} already loaded.`);
			return true;
		}

		this.dungeons.push(location);
		log('debug', `Dungeon ${location.id} loaded.`);

		return true;
	}

	async unloadLocation(location: Dungeon, save = true): Promise<boolean> {
		if (location.constructor.name !== Dungeon.name) {
			log('error', `${location} is not PlayerBase instance:`);
			log('error', location);
			return false;
		}

		const toUnload = find(this.dungeons, ptu => ptu.id === location.id);

		if (!toUnload) {
			log('debug', `@unloadLocation: Dungeon ${location.id} not loaded.`);
			return false;
		}

		if (save) {
			await this.saveLocation(toUnload);
		}

		const index = findIndex(this.dungeons, pa => pa.id === location.id);

		if (index > -1) {
			this.dungeons.splice(index, 1);
		} else {
			log('error', `@unloadLocation: Error finding index in Dungeon of ${location.id}`);
		}
		log('debug', `Dungeon ${toUnload.id} unloaded.`);

		return true;
	}

	async unloadAllLocations() {
		for (const location of this.dungeons) {
			await this.unloadLocation(location);
		}
	}

	async saveLocation(location: Dungeon): Promise<boolean> {
		if (location.constructor.name !== Dungeon.name) {
			log('error', `${location} is not Dungeon instance:`);
			log('error', location);
			return false;
		}

		if (!location.isPerm) {
			return;
		}

		await this.entityManager.save(location);
		log('debug', `Dungeon ${location.id} saved.`);

		return true;
	}

	async getLocation(mapElementId: string): Promise<Dungeon> {
		const location = find(this.dungeons, loadedDungeons => loadedDungeons.mapElement.id === mapElementId);
		if (location) {
			return location;
		}

		const dungeonToLoad = await this.findByMapElementId(mapElementId);

		if (dungeonToLoad) {
			await this.roomItemsToInstances(dungeonToLoad.rooms);
			this.loadLocation(dungeonToLoad);
			return dungeonToLoad;
		}

		return null;
	}

	async getLocationById(id: string): Promise<Dungeon> {
		const location = find(this.dungeons, loadedDungeons => loadedDungeons.id === id);
		if (location) {
			return location;
		}

		const dungeonToLoad = await this.findById(id);

		if (dungeonToLoad) {
			await this.roomItemsToInstances(dungeonToLoad.rooms);
			this.loadLocation(dungeonToLoad);
			return dungeonToLoad;
		}

		return null;
	}

	private async roomItemsToInstances(rooms: {[s: number]: {[s: number]: IRoom }}) {
		for (const x in rooms) {
			if (rooms.hasOwnProperty(x)) {
				const row = rooms[x];

				for (const y in row) {
					if (row.hasOwnProperty(y)) {
						const room = rooms[x][y];

						if (isArray(room.items)) {
							const items = room.items;

							for (const i in items) {
								if (items.hasOwnProperty(i)) {
									items[i] = await this.itemsService.getItem(items[i].data.id);
								}
							}
						}
					}
				}
			}
		}
	}

	private async findById(id: string): Promise<Dungeon> {
		return await this.dungeonRepository.findOne({
			where: {
				id
			}
		});
	}

	private async findByMapElementId(mapElementId: string): Promise<Dungeon> {
		return await this.dungeonRepository.findOne({
			where: {
				mapElement: mapElementId
			},
			relations: ['mapElement']
		});
	}
}
