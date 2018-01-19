import { Guard, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs/Observable';

import { PlayersService } from '../player/players.service';

@Guard()
export class LoggedInGuard implements CanActivate {
	constructor(private readonly playersService: PlayersService) {}

	async canActivate(dataOrRequest, context: ExecutionContext): Promise<boolean> {
		const { session } = dataOrRequest;

		return await LoggedInGuard.check(session, this.playersService);
	}

	static async isLoggedIn(session, playersService: PlayersService) {
		return await LoggedInGuard.check(session, playersService);
	}

	static async check(session, playersService: PlayersService) {
		if (!session || !session.playerID || !session.login) {
			return false;
		}

		const player = await playersService.getPlayerById(session.playerID);

		if (!player || player.login !== session.login || player.sessionId !== session.id) {
			return false;
		}

		return true;
	}
}
