import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';

import { MapPosition } from '../map/interfaces/map-position.interface';
import { PlayerBase } from '../locations/entities/player-base/player-base.entity';
import { Inventory } from '../inventory';

@Entity({ name: 'Players' })
export class Player {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ length: 30, unique: true })
	login: string;

	@Column()
	password: string;

	@Column({ default: 100, type: 'real' })
	hp: number;

	@Column({ default: 0, type: 'real' })
	hunger: number;

	@Column({ default: 100, type: 'real' })
	energy: number;

	@Column({ name: 'map_position', type: 'json' })
	mapPosition: MapPosition;

	@OneToOne(type => PlayerBase, base => base.player) // specify inverse side as a second parameter
    base: PlayerBase;

    @OneToOne(type => Inventory)
    @JoinColumn()
    inventory: Inventory;

    @Column({ name: 'location_id', nullable: true })
    locationId: string = null;

    @Column({ name: 'location_type', nullable: true })
    locationType: string = null;

	sessionId: string;
	socket: SocketIO.Socket;

	online = false;

	mapTarget: MapPosition = null;
	sendingPositionTime = 0;

	setOnline(): void {
		this.online = true;
	}

	setOffline(): void {
		this.online = false;
	}

	isAlive() {
		return this.hp > 0;
	}

	setInLocation(type: string, id: string) {
		this.locationId = id;
		this.locationType = type;
	}

	exitLocation() {
		this.locationId = null;
		this.locationType = null;
	}

	inLocation(): boolean {
		return !!this.locationId;
	}

	affect(actions: {
		hunger?: number
	}) {
		if (!actions) {
			return;
		}

		if (actions.hunger) {
			this.hunger -= actions.hunger;
		}

		if (this.hunger > 100) {
			this.hunger = 100;
		}
		if (this.hunger < 0) {
			this.hunger = 0;
		}
	}
}
